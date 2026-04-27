import prisma from '../utils/prisma';
import { PLATFORM_CITY } from '../config/constants';

export type OpportunityType =
  | 'DEMAND_SPIKE'
  | 'LOW_COMPETITION'
  | 'PRICE_OPPORTUNITY'
  | 'NEW_ZONE'
  | 'SERVICE_WANTED';

export interface OpportunityPayload {
  userId: string;
  type: OpportunityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

async function createOpportunity(payload: OpportunityPayload): Promise<void> {
  // Avoid duplicates: don't create same type for same user in last 24h
  const recent = await prisma.opportunity.findFirst({
    where: {
      userId: payload.userId,
      type: payload.type,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) return;

  await prisma.opportunity.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      expiresAt: payload.expiresAt,
    },
  });
}

async function detectDemandSpikes(): Promise<void> {
  const allGroups = await prisma.booking.groupBy({
    by: ['serviceId'],
    where: {
      createdAt: { gt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      status: 'PENDING',
    },
    _count: { id: true },
  });

  const recentBookings = allGroups.filter(g => g._count.id >= 3);

  for (const group of recentBookings) {
    const service = await prisma.service.findUnique({
      where: { id: group.serviceId },
      select: { category: true },
    });
    if (!service) continue;

    // Find professionals in this category who have low recent bookings
    const activePros = await prisma.professionalProfile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        isVisible: true,
        services: { some: { category: service.category, isActive: true } },
      },
      select: {
        id: true,
        userId: true,
        bookings: {
          where: { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          select: { id: true },
        },
      },
    });

    for (const pro of activePros) {
      if (pro.bookings.length < 2) {
        await createOpportunity({
          userId: pro.userId,
          type: 'DEMAND_SPIKE',
          title: `Alta demanda en ${service.category}`,
          description: `Hay ${group._count.id} solicitudes recientes sin atender en ${PLATFORM_CITY} para tu categoría. Es un buen momento para estar disponible.`,
          metadata: { category: service.category, pendingCount: group._count.id },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
    }
  }
}

async function detectLowCompetition(): Promise<void> {
  const categories = [
    'PLUMBING','ELECTRICIAN','GARDENING','CLEANING','HANDYMAN',
    'CHEF','HAIRDRESSING','BEAUTY','MASSAGE','PERSONAL_TRAINER',
    'CHILDCARE','ELDERCARE','PET_CARE','TUTORING',
  ];

  for (const category of categories) {
    const count = await prisma.professionalProfile.count({
      where: {
        verificationStatus: 'APPROVED',
        isVisible: true,
        services: { some: { category, isActive: true } },
      },
    });

    if (count > 0 && count <= 3) {
      const pros = await prisma.professionalProfile.findMany({
        where: {
          verificationStatus: 'APPROVED',
          isVisible: true,
          services: { some: { category, isActive: true } },
        },
        select: { userId: true },
      });

      for (const pro of pros) {
        await createOpportunity({
          userId: pro.userId,
          type: 'LOW_COMPETITION',
          title: `Poca competencia en ${category}`,
          description: `Solo hay ${count} profesional${count > 1 ? 'es' : ''} activo${count > 1 ? 's' : ''} en ${category} en ${PLATFORM_CITY}. Destaca actualizando tu perfil y precios para capturar más clientes.`,
          metadata: { category, competitorCount: count },
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
}

async function detectPriceOpportunities(): Promise<void> {
  // Find professionals whose prices are well below market average (losing revenue)
  const categories = ['PLUMBING','ELECTRICIAN','CLEANING','HANDYMAN','GARDENING'];

  for (const category of categories) {
    const services = await prisma.service.findMany({
      where: { category, isActive: true },
      select: { price: true, professionalId: true, professional: { select: { userId: true, level: true } } },
    });

    if (services.length < 3) continue;

    const prices = services.map(s => s.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    for (const svc of services) {
      if (svc.price < avg * 0.7) {
        await createOpportunity({
          userId: (svc.professional as any).userId,
          type: 'PRICE_OPPORTUNITY',
          title: 'Puedes cobrar más por tus servicios',
          description: `Tu precio de ${svc.price}€ está un ${Math.round(((avg - svc.price) / avg) * 100)}% por debajo de la media en ${PLATFORM_CITY} (${Math.round(avg)}€). Considera actualizarlo para maximizar tus ingresos.`,
          metadata: { category, currentPrice: svc.price, marketAvg: Math.round(avg) },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
}

export async function runOpportunityAgent(): Promise<void> {
  try {
    await Promise.all([
      detectDemandSpikes().catch(() => {}),
      detectLowCompetition().catch(() => {}),
      detectPriceOpportunities().catch(() => {}),
    ]);

    await prisma.opportunity.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {});
  } catch (err) {
    console.error('[OpportunityAgent] Error:', err);
  }
}

export async function getUserOpportunities(userId: string) {
  return prisma.opportunity.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => []);
}

export async function markOpportunityRead(id: string, userId: string): Promise<void> {
  await prisma.opportunity.updateMany({
    where: { id, userId },
    data: { isRead: true },
  }).catch(() => {});
}
