import prisma from '../utils/prisma';
import { ESCROW_AUTO_RELEASE_HOURS } from '../config/constants';

export async function holdEscrow(bookingId: string, amount: number): Promise<void> {
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
  await prisma.escrowTransaction.update({
    where: { bookingId },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'RELEASED' },
  });
}

export async function refundEscrow(bookingId: string): Promise<void> {
  await prisma.escrowTransaction.update({
    where: { bookingId },
    data: { status: 'REFUNDED', refundedAt: new Date() },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'REFUNDED' },
  });
}

export async function processAutoReleases(): Promise<number> {
  const now = new Date();
  const due = await prisma.escrowTransaction.findMany({
    where: {
      status: 'HELD',
      releaseScheduledAt: { lte: now },
    },
  });

  for (const escrow of due) {
    await releaseEscrow(escrow.bookingId);
    await prisma.booking.update({
      where: { id: escrow.bookingId },
      data: { status: 'COMPLETED', completedAt: now },
    });
  }

  return due.length;
}

