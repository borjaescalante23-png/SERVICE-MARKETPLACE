import prisma from '../utils/prisma';

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

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: {
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
      completedJobs: completed,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    },
  });
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
