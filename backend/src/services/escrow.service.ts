import prisma from '../utils/prisma';
import { ESCROW_AUTO_RELEASE_HOURS } from '../config/constants';
import { transferToProvider } from './stripe-connect.service';
import { notifyPaymentReleased } from './notification.service';

const TRANSFER_MAX_ATTEMPTS = 3;
const TRANSFER_RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function attemptTransferWithRetry(
  connectAccountId: string,
  amountEur: number,
  bookingId: string,
): Promise<string> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= TRANSFER_MAX_ATTEMPTS; attempt++) {
    try {
      const transferId = await transferToProvider(connectAccountId, amountEur, bookingId);
      return transferId;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[Escrow] Transfer attempt ${attempt}/${TRANSFER_MAX_ATTEMPTS} failed for booking ${bookingId}: ${lastError.message}`,
      );
      if (attempt < TRANSFER_MAX_ATTEMPTS) await sleep(TRANSFER_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function notifyAdminTransferFailed(bookingId: string, errorMsg: string): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (admins.length === 0) {
      console.error(
        `[Escrow] CRITICAL: No admin users found to notify. Transfer permanently failed for booking ${bookingId}. Error: ${errorMsg}`,
      );
      return;
    }

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'TRANSFER_FAILED',
        title: 'Transferencia al profesional fallida — Acción requerida',
        body: `La transferencia de fondos para el booking ${bookingId} ha fallado tras ${TRANSFER_MAX_ATTEMPTS} intentos. El profesional no ha recibido su pago. Error: ${errorMsg}`,
        data: JSON.stringify({ bookingId, error: errorMsg }),
        priority: 'HIGH',
        isRead: false,
      })),
    });

    console.error(
      `[Escrow] CRITICAL: Transfer permanently failed for booking ${bookingId}. ${admins.length} admin(s) notified.`,
    );
  } catch (notifyErr) {
    // Never let a notification failure mask the original transfer failure
    console.error(
      `[Escrow] Failed to notify admins about transfer failure for booking ${bookingId}:`,
      notifyErr,
    );
  }
}

export async function holdEscrow(bookingId: string, amount: number): Promise<void> {
  const existing = await prisma.escrowTransaction.findUnique({ where: { bookingId } });
  if (existing) return;

  const releaseScheduledAt = new Date();
  releaseScheduledAt.setHours(releaseScheduledAt.getHours() + ESCROW_AUTO_RELEASE_HOURS);

  await prisma.escrowTransaction.create({
    data: {
      bookingId,
      amount,
      status: 'HELD',
      releaseScheduledAt,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'HELD_IN_ESCROW' },
  });
}

export async function releaseEscrow(bookingId: string): Promise<void> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { bookingId } });

  if (!escrow) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'RELEASED' },
    });
    return;
  }

  if (escrow.status === 'RELEASED' || escrow.status === 'TRANSFER_FAILED') return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  const connectId = booking?.professional?.stripeConnectId;
  const isStripeConfigured =
    !!process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA');

  if (connectId && isStripeConfigured && booking) {
    // Transfer to provider FIRST. The DB must only reflect RELEASED after a confirmed transfer.
    try {
      await attemptTransferWithRetry(connectId, booking.professionalAmount, bookingId);
    } catch (err: any) {
      // All retries exhausted — mark as failed, do NOT change status to RELEASED
      const errorMsg = err?.message ?? 'Error desconocido';

      await prisma.$transaction([
        prisma.escrowTransaction.update({
          where: { bookingId },
          data: { status: 'TRANSFER_FAILED' },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'TRANSFER_FAILED' },
        }),
      ]);

      await notifyAdminTransferFailed(bookingId, errorMsg);

      throw new Error(
        `[Escrow] Transfer permanently failed for booking ${bookingId} after ${TRANSFER_MAX_ATTEMPTS} attempts: ${errorMsg}`,
      );
    }
  }

  // Transfer confirmed (or Stripe not configured in dev) — update both records atomically
  await prisma.$transaction([
    prisma.escrowTransaction.update({
      where: { bookingId },
      data: { status: 'RELEASED', releasedAt: new Date() },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'RELEASED' },
    }),
  ]);
}

export async function refundEscrow(bookingId: string): Promise<void> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { bookingId } });

  if (escrow && escrow.status === 'HELD') {
    await prisma.$transaction([
      prisma.escrowTransaction.update({
        where: { bookingId },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'REFUNDED' },
      }),
    ]);
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'REFUNDED' },
  });
}

export async function partialRefundEscrow(bookingId: string, refundAmount: number): Promise<void> {
  if (refundAmount <= 0) {
    throw new Error(
      `[Escrow] partialRefundEscrow called with invalid refundAmount (${refundAmount}) for booking ${bookingId}`,
    );
  }

  const escrow = await prisma.escrowTransaction.findUnique({ where: { bookingId } });

  if (!escrow || escrow.status !== 'HELD') {
    console.warn(
      `[Escrow] partialRefundEscrow: booking ${bookingId} escrow is not in HELD state (status: ${escrow?.status ?? 'not found'}). Skipping.`,
    );
    return;
  }

  if (refundAmount > escrow.amount) {
    throw new Error(
      `[Escrow] partialRefundEscrow: refundAmount (€${refundAmount.toFixed(2)}) exceeds held amount (€${escrow.amount.toFixed(2)}) for booking ${bookingId}`,
    );
  }

  await prisma.$transaction([
    prisma.escrowTransaction.update({
      where: { bookingId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'REFUNDED' },
    }),
  ]);

  console.info(
    `[Escrow] Partial refund of €${refundAmount.toFixed(2)} (of €${escrow.amount.toFixed(2)} held) persisted for booking ${bookingId}`,
  );
}

export async function processAutoReleases(): Promise<number> {
  const now = new Date();
  let released = 0;

  // Standard scheduled releases
  const scheduledDue = await prisma.escrowTransaction.findMany({
    where: { status: 'HELD', releaseScheduledAt: { lte: now } },
    include: { booking: true },
  });

  for (const escrow of scheduledDue) {
    try {
      const newStatus =
        escrow.booking.status === 'COMPLETED_BY_PROVIDER' ? 'AUTO_COMPLETED' : 'COMPLETED';
      await releaseEscrow(escrow.bookingId);
      await prisma.booking.update({
        where: { id: escrow.bookingId },
        data: { status: newStatus, completedAt: now },
      });
      notifyPaymentReleased(escrow.bookingId).catch(() => {});
      released++;
    } catch (err) {
      // Log and continue — one failed transfer must not block the rest
      console.error(`[Escrow] Auto-release failed for booking ${escrow.bookingId}:`, err);
    }
  }

  // 48h auto-release for COMPLETED_BY_PROVIDER
  const providerCompletedDue = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED_BY_PROVIDER',
      autoReleaseAt: { lte: now },
      paymentStatus: 'HELD_IN_ESCROW',
    },
  });

  for (const booking of providerCompletedDue) {
    try {
      await releaseEscrow(booking.id);
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'AUTO_COMPLETED', completedAt: now },
      });
      notifyPaymentReleased(booking.id).catch(() => {});
      released++;
    } catch (err) {
      console.error(
        `[Escrow] Auto-release (provider completed) failed for booking ${booking.id}:`,
        err,
      );
    }
  }

  return released;
}
