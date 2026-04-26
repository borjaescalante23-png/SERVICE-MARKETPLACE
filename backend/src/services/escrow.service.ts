import prisma from '../utils/prisma';
import { ESCROW_AUTO_RELEASE_HOURS } from '../config/constants';
import { transferToProvider } from './stripe-connect.service';
import { notifyPaymentReleased } from './notification.service';

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
    await prisma.booking.update({ where: { id: bookingId }, data: { paymentStatus: 'RELEASED' } });
    return;
  }

  if (escrow.status === 'RELEASED') return;

  await prisma.escrowTransaction.update({
    where: { bookingId },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'RELEASED' },
  });

  // Transfer provider's share to their Connect account if configured
  if (escrow) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { professional: true },
    });
    const connectId = booking?.professional?.stripeConnectId;
    const isStripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA');
    if (connectId && isStripeConfigured && booking) {
      transferToProvider(connectId, booking.professionalAmount, bookingId)
        .catch(err => console.error('Connect transfer failed:', err));
    }
  }
}

export async function refundEscrow(bookingId: string): Promise<void> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { bookingId } });

  if (escrow && escrow.status === 'HELD') {
    await prisma.escrowTransaction.update({
      where: { bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'REFUNDED' },
  });
}

export async function partialRefundEscrow(bookingId: string, refundAmount: number): Promise<void> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { bookingId } });

  if (escrow && escrow.status === 'HELD') {
    await prisma.escrowTransaction.update({
      where: { bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'REFUNDED' },
  });
}

export async function processAutoReleases(): Promise<number> {
  const now = new Date();

  // Standard scheduled releases
  const scheduledDue = await prisma.escrowTransaction.findMany({
    where: { status: 'HELD', releaseScheduledAt: { lte: now } },
    include: { booking: true },
  });

  for (const escrow of scheduledDue) {
    const newStatus = escrow.booking.status === 'COMPLETED_BY_PROVIDER' ? 'AUTO_COMPLETED' : 'COMPLETED';
    await releaseEscrow(escrow.bookingId);
    await prisma.booking.update({
      where: { id: escrow.bookingId },
      data: { status: newStatus, completedAt: now },
    });
    notifyPaymentReleased(escrow.bookingId).catch(() => {});
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
    await releaseEscrow(booking.id);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'AUTO_COMPLETED', completedAt: now },
    });
    notifyPaymentReleased(booking.id).catch(() => {});
  }

  return scheduledDue.length + providerCompletedDue.length;
}

