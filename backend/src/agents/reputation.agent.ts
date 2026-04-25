import prisma from '../utils/prisma';

export interface TrustScore {
  overall: number; // 0-100
  components: {
    verification: number;   // 0-25: documents, identity
    performance: number;    // 0-25: ratings, completion rate
    reliability: number;    // 0-25: acceptance, cancellation
    longevity: number;      // 0-15: time on platform, activity
    social: number;         // 0-10: reviews count, response diversity
  };
  badges: string[];
  level: string;
  nextLevelRequirements: string[] | null;
}

export async function computeTrustScore(professionalId: string): Promise<TrustScore> {
  const pro = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    include: {
      documents: true,
      experienceEntries: { include: { images: true } },
      bookings: { select: { status: true, createdAt: true } },
      user: { select: { createdAt: true } },
    },
  });

  if (!pro) throw new Error('Professional not found');

  // Verification component (0-25)
  let verification = 0;
  const approvedDocs = pro.documents.filter(d => d.status === 'APPROVED');
  const hasId = approvedDocs.some(d => ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE'].includes(d.type));
  const hasCertif = approvedDocs.some(d => d.type === 'CERTIFICATION');
  if (pro.verificationStatus === 'APPROVED') verification += 15;
  if (hasId) verification += 5;
  if (hasCertif) verification += 3;
  const validEntries = pro.experienceEntries.filter(e => e.images.length > 0);
  verification += Math.min(validEntries.length, 2);

  // Performance component (0-25)
  const ratingScore = Math.round(Math.min((pro.avgRating / 5) * 15, 15));
  const completionScore = Math.round(Math.min((pro.completedJobs / 50) * 10, 10));
  const performance = ratingScore + completionScore;

  // Reliability component (0-25)
  const acceptScore = Math.round(pro.acceptanceRate * 15);
  const cancelScore = Math.round((1 - pro.cancellationRate) * 10);
  const reliability = Math.min(acceptScore + cancelScore, 25);

  // Longevity component (0-15)
  const monthsActive = Math.floor(
    (Date.now() - new Date(pro.user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const longevity = Math.min(Math.floor(monthsActive / 2), 15);

  // Social component (0-10)
  const reviewScore = Math.min(pro.totalReviews, 10);
  const social = reviewScore;

  const overall = verification + performance + reliability + longevity + social;

  // Badges
  const badges: string[] = [];
  if (hasId) badges.push('IDENTITY_VERIFIED');
  if (hasCertif) badges.push('CERTIFIED');
  if (pro.avgRating >= 4.8) badges.push('TOP_RATED');
  if (pro.completedJobs >= 50) badges.push('EXPERIENCED');
  if (pro.completedJobs >= 100) badges.push('EXPERT');
  if (pro.cancellationRate <= 0.02) badges.push('RELIABLE');
  if (pro.acceptanceRate >= 0.95) badges.push('RESPONSIVE');
  if (monthsActive >= 12) badges.push('VETERAN');

  // Next level requirements
  const nextLevelRequirements: string[] = [];
  if (pro.level === 'VERIFIED') {
    if (pro.avgRating < 4.5) nextLevelRequirements.push(`Sube tu valoración a 4.5 (actual: ${pro.avgRating.toFixed(1)})`);
    if (pro.completedJobs < 10) nextLevelRequirements.push(`Completa ${10 - pro.completedJobs} trabajos más`);
    if (pro.acceptanceRate < 0.8) nextLevelRequirements.push('Mejora tu tasa de aceptación al 80%');
  } else if (pro.level === 'PRO') {
    if (pro.avgRating < 4.8) nextLevelRequirements.push(`Sube tu valoración a 4.8 (actual: ${pro.avgRating.toFixed(1)})`);
    if (pro.completedJobs < 50) nextLevelRequirements.push(`Completa ${50 - pro.completedJobs} trabajos más`);
    if (pro.acceptanceRate < 0.9) nextLevelRequirements.push('Mejora tu tasa de aceptación al 90%');
    if (pro.cancellationRate > 0.05) nextLevelRequirements.push('Reduce tu tasa de cancelación por debajo del 5%');
  }

  return {
    overall,
    components: { verification, performance, reliability, longevity, social },
    badges,
    level: pro.level,
    nextLevelRequirements: nextLevelRequirements.length > 0 ? nextLevelRequirements : null,
  };
}

export async function getLeaderboard(category?: string, limit = 10) {
  const pros = await prisma.professionalProfile.findMany({
    where: {
      verificationStatus: 'APPROVED',
      isVisible: true,
      ...(category ? { services: { some: { category, isActive: true } } } : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: [
      { level: 'desc' },
      { avgRating: 'desc' },
      { completedJobs: 'desc' },
    ],
    take: limit,
  });

  return pros.map(p => ({
    professionalId: p.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    avatarUrl: p.user.avatarUrl,
    level: p.level,
    avgRating: p.avgRating,
    totalReviews: p.totalReviews,
    completedJobs: p.completedJobs,
    city: p.city,
  }));
}
