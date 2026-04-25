import prisma from '../utils/prisma';
import { notifyLevelUp } from './notification.service';

export async function recalculateProfessionalStats(professionalId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { booking: { professionalId } },
  });

  const bookings = await prisma.booking.findMany({
    where: { professionalId },
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled = bookings.filter(b => b.status === 'CANCELLED' && b.cancelledBy === professionalId).length;
  const accepted = bookings.filter(b => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)).length;
  const total = bookings.filter(b => b.status !== 'PENDING').length;

  const cancellationRate = completed + cancelled > 0 ? cancelled / (completed + cancelled) : 0;
  const acceptanceRate = total > 0 ? accepted / total : 0;

  const profile = await prisma.professionalProfile.findUnique({ where: { id: professionalId } });
  const prevLevel = profile?.level || 'VERIFIED';

  let newLevel = 'VERIFIED';
  const roundedRating = Math.round(avgRating * 10) / 10;
  if (roundedRating >= 4.8 && completed >= 50 && acceptanceRate >= 0.9 && cancellationRate <= 0.05) {
    newLevel = 'ELITE';
  } else if (roundedRating >= 4.5 && completed >= 10 && acceptanceRate >= 0.8) {
    newLevel = 'PRO';
  }

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: {
      avgRating: roundedRating,
      totalReviews,
      completedJobs: completed,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      level: newLevel,
    },
  });

  if (newLevel !== prevLevel && newLevel !== 'VERIFIED') {
    notifyLevelUp(professionalId, newLevel).catch(() => {});
  }
}

export async function checkVisibilityEligibility(professionalId: string): Promise<boolean> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    include: {
      experienceEntries: { include: { images: true } },
      documents: true,
    },
  });

  if (!profile) return false;
  if (profile.verificationStatus !== 'APPROVED') return false;

  const validEntries = profile.experienceEntries.filter(e => e.images.length > 0);
  if (validEntries.length < 2) return false;

  const hasIdDoc = profile.documents.some(
    d => ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE'].includes(d.type) && d.status === 'APPROVED'
  );
  if (!hasIdDoc) return false;

  return true;
}
