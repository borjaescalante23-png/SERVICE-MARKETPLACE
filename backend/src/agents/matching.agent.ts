import crypto from 'crypto';
import prisma from '../utils/prisma';
import { PLATFORM_CITY } from '../config/constants';

export interface MatchRequest {
  category: string;
  city?: string; // Always overridden to PLATFORM_CITY (Barcelona)
  serviceMode?: string;
  scheduledAt?: string;
  maxPrice?: number;
  clientId?: string;
}

export interface MatchResult {
  professionalId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  level: string;
  avgRating: number;
  totalReviews: number;
  completedJobs: number;
  city: string | null;
  travelRadius: number | null;
  serviceMode: string;
  score: number;
  breakdown: {
    location: number;
    rating: number;
    level: number;
    experience: number;
    acceptance: number;
    availability: number;
  };
  matchedService: {
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null;
}

function requestHash(req: MatchRequest): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ ...req, clientId: undefined }))
    .digest('hex')
    .slice(0, 16);
}

function scoreLocation(pro: any): number {
  // Platform is Barcelona-only. Score based on city match within metropolitan area.
  const proCity = (pro.city || '').toLowerCase().trim();
  if (proCity === 'barcelona') return 20;
  if (proCity.includes('barcelona')) return 16; // e.g. "área barcelona"
  // Adjacent municipalities within Barcelona metropolitan area
  const bcnMetro = ['hospitalet', 'badalona', 'terrassa', 'sabadell', 'cornellà', 'sant cugat', 'gavà', 'viladecans', 'castelldefels', 'mollet', 'granollers', 'mataró'];
  if (bcnMetro.some(m => proCity.includes(m))) return 12;
  if (pro.serviceMode === 'REMOTE') return 8;
  return 0;
}

function scoreLevel(level: string): number {
  if (level === 'ELITE') return 15;
  if (level === 'PRO') return 10;
  return 5;
}

function scoreRating(avgRating: number, totalReviews: number): number {
  if (totalReviews === 0) return 8;
  return Math.round(Math.min(avgRating * 4, 20));
}

function scoreExperience(completedJobs: number): number {
  if (completedJobs >= 100) return 15;
  if (completedJobs >= 50) return 12;
  if (completedJobs >= 20) return 10;
  if (completedJobs >= 5) return 7;
  if (completedJobs >= 1) return 4;
  return 2;
}

function scoreAcceptance(acceptanceRate: number): number {
  return Math.round(acceptanceRate * 10);
}

function scoreAvailability(pro: any, scheduledAt?: string): number {
  // Without a real availability model, reward profiles with recent activity
  if (!scheduledAt) return 5;
  const dayOfWeek = new Date(scheduledAt).getDay();
  // Weekday boost (Mon-Fri = 1-5)
  return dayOfWeek >= 1 && dayOfWeek <= 5 ? 10 : 7;
}

export async function matchProfessionals(req: MatchRequest): Promise<MatchResult[]> {
  // Always restrict to Barcelona regardless of what the caller passes
  req = { ...req, city: PLATFORM_CITY };
  const hash = requestHash(req);

  // Check cache (valid for 5 minutes)
  const cached = await prisma.matchScore.findMany({
    where: {
      requestHash: hash,
      expiresAt: { gt: new Date() },
    },
    orderBy: { score: 'desc' },
    take: 20,
  }).catch(() => []);

  if (cached.length > 0) {
    // Hydrate from cache
    const ids = cached.map(c => c.professionalId);
    const profiles = await prisma.professionalProfile.findMany({
      where: { id: { in: ids } },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        services: { where: { category: req.category, isActive: true }, take: 1 },
      },
    });

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    return cached
      .filter(c => profileMap.has(c.professionalId))
      .map(c => {
        const p = profileMap.get(c.professionalId)!;
        const breakdown = JSON.parse(c.breakdown);
        return buildResult(p, c.score, breakdown);
      });
  }

  // Fresh computation — Barcelona metropolitan area only
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      verificationStatus: 'APPROVED',
      isVisible: true,
      services: {
        some: { category: req.category, isActive: true },
      },
      OR: [
        { city: { contains: 'Barcelona' } },
        { city: { contains: 'barcelona' } },
        { serviceMode: 'REMOTE' },
      ],
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      services: { where: { category: req.category, isActive: true }, take: 1 },
    },
  });

  const results: MatchResult[] = [];

  for (const pro of professionals) {
    // Filter by price if specified
    const service = pro.services[0];
    if (req.maxPrice && service && service.price > req.maxPrice) continue;

    // Filter by service mode compatibility
    if (req.serviceMode === 'PRESENTIAL' && pro.serviceMode === 'REMOTE') continue;

    const breakdown = {
      location: scoreLocation(pro),
      rating: scoreRating(pro.avgRating, pro.totalReviews),
      level: scoreLevel(pro.level),
      experience: scoreExperience(pro.completedJobs),
      acceptance: scoreAcceptance(pro.acceptanceRate),
      availability: scoreAvailability(pro, req.scheduledAt),
    };

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Skip professionals that scored 0 on location (not reachable)
    if (breakdown.location === 0) continue;

    results.push(buildResult(pro, score, breakdown));

    // Cache this score
    await prisma.matchScore.create({
      data: {
        professionalId: pro.id,
        requestHash: hash,
        score,
        breakdown: JSON.stringify(breakdown),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    }).catch(() => {});
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

function buildResult(pro: any, score: number, breakdown: any): MatchResult {
  const service = pro.services?.[0] || null;
  return {
    professionalId: pro.id,
    userId: pro.userId,
    firstName: pro.user.firstName,
    lastName: pro.user.lastName,
    avatarUrl: pro.user.avatarUrl,
    level: pro.level,
    avgRating: pro.avgRating,
    totalReviews: pro.totalReviews,
    completedJobs: pro.completedJobs,
    city: pro.city,
    travelRadius: pro.travelRadius,
    serviceMode: pro.serviceMode,
    score,
    breakdown,
    matchedService: service
      ? { id: service.id, name: service.name, price: service.price, duration: service.duration }
      : null,
  };
}

export async function cleanExpiredMatchScores(): Promise<number> {
  const result = await prisma.matchScore.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => ({ count: 0 }));
  return result.count;
}
