import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

const createRequestSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  preferredDate: z.string().optional(),
  maxBudget: z.number().positive().optional(),
  address: z.string().max(500).optional(),
});

const applySchema = z.object({
  proposedPrice: z.number().positive(),
  message: z.string().min(10).max(1000),
});

export async function createOpportunityRequest(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { category, title, description, preferredDate, maxBudget, address } = parsed.data;

  const request = await prisma.opportunityRequest.create({
    data: {
      clientId: req.user!.userId,
      category,
      title,
      description,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      maxBudget: maxBudget ?? null,
      address: address ?? null,
    },
  });

  res.status(201).json(request);
}

export async function getOpportunityRequests(req: AuthRequest, res: Response): Promise<void> {
  const { role } = req.user!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  if (role === 'CLIENT') {
    const [requests, total] = await Promise.all([
      prisma.opportunityRequest.findMany({
        where: { clientId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { applications: true } } },
      }),
      prisma.opportunityRequest.count({ where: { clientId: req.user!.userId } }),
    ]);
    res.json({ data: requests, total, page, limit });
    return;
  }

  // Provider: see OPEN requests
  const category = req.query.category as string | undefined;
  const where: any = { status: 'OPEN' };
  if (category) where.category = category;

  const [requests, total] = await Promise.all([
    prisma.opportunityRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.opportunityRequest.count({ where }),
  ]);
  res.json({ data: requests, total, page, limit });
}

export async function getOpportunityRequestById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const request = await prisma.opportunityRequest.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!request) {
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  // Clients can only see their own; providers can see OPEN ones
  if (role === 'CLIENT' && request.clientId !== userId) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  res.json(request);
}

export async function applyToOpportunityRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId } = req.user!;

  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const request = await prisma.opportunityRequest.findUnique({ where: { id } });
  if (!request || request.status !== 'OPEN') {
    res.status(404).json({ error: 'Solicitud no disponible' });
    return;
  }

  const professional = await prisma.professionalProfile.findUnique({ where: { userId } });
  if (!professional) {
    res.status(403).json({ error: 'Debes ser profesional para aplicar' });
    return;
  }

  const existing = await prisma.opportunityApplication.findFirst({
    where: { requestId: id, professionalId: professional.id },
  });
  if (existing) {
    res.status(409).json({ error: 'Ya has aplicado a esta solicitud' });
    return;
  }

  const application = await prisma.opportunityApplication.create({
    data: {
      requestId: id,
      professionalId: professional.id,
      proposedPrice: parsed.data.proposedPrice,
      message: parsed.data.message,
    },
  });

  res.status(201).json(application);
}

export async function acceptApplication(req: AuthRequest, res: Response): Promise<void> {
  const { id, appId } = req.params;
  const { userId } = req.user!;

  const request = await prisma.opportunityRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== userId) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  const application = await prisma.opportunityApplication.findUnique({ where: { id: appId } });
  if (!application || application.requestId !== id) {
    res.status(404).json({ error: 'Aplicación no encontrada' });
    return;
  }

  await prisma.$transaction([
    prisma.opportunityApplication.update({
      where: { id: appId },
      data: { status: 'ACCEPTED' },
    }),
    prisma.opportunityApplication.updateMany({
      where: { requestId: id, id: { not: appId } },
      data: { status: 'REJECTED' },
    }),
    prisma.opportunityRequest.update({
      where: { id },
      data: { status: 'CLOSED' },
    }),
  ]);

  res.json({ message: 'Aplicación aceptada' });
}

export async function cancelOpportunityRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId } = req.user!;

  const request = await prisma.opportunityRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== userId) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  await prisma.opportunityRequest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  res.json({ message: 'Solicitud cancelada' });
}
