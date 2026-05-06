import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { checkVisibilityEligibility } from '../services/professional.service';
import { refundEscrow, releaseEscrow } from '../services/escrow.service';

export async function getPendingProfessionals(req: AuthRequest, res: Response): Promise<void> {
  const professionals = await prisma.professionalProfile.findMany({
    where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, createdAt: true } },
      documents: true,
      experienceEntries: { include: { images: true } },
      _count: { select: { services: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(professionals);
}

export async function approveProfessional(req: AuthRequest, res: Response): Promise<void> {
  const { professionalId } = req.params;

  const profile = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    include: {
      experienceEntries: { include: { images: true } },
      documents: true,
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }

  const validEntries = profile.experienceEntries.filter(e => e.images.length > 0);
  if (validEntries.length < 2) {
    res.status(400).json({
      error: 'El profesional debe tener al menos 2 entradas de experiencia con imágenes',
    });
    return;
  }

  const hasIdDoc = profile.documents.some(
    d => ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE'].includes(d.type)
  );
  if (!hasIdDoc) {
    res.status(400).json({ error: 'El profesional debe subir un documento de identidad' });
    return;
  }

  await prisma.$transaction([
    prisma.professionalProfile.update({
      where: { id: professionalId },
      data: { verificationStatus: 'APPROVED', verifiedAt: new Date(), isVisible: true },
    }),
    prisma.verificationDocument.updateMany({
      where: { professionalId, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { isVerified: true },
    }),
  ]);

  res.json({ message: 'Profesional aprobado y visible en el marketplace' });
}

export async function rejectProfessional(req: AuthRequest, res: Response): Promise<void> {
  const { professionalId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({ error: 'Motivo de rechazo requerido' });
    return;
  }

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: { verificationStatus: 'REJECTED', rejectionReason: reason, isVisible: false },
  });

  res.json({ message: 'Profesional rechazado' });
}

export async function suspendUser(req: AuthRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });

  if (user.role === 'PROFESSIONAL') {
    await prisma.professionalProfile.update({
      where: { userId },
      data: { verificationStatus: 'SUSPENDED', isVisible: false },
    });
  }

  await prisma.fraudEvent.create({
    data: {
      userId,
      eventType: 'USER_SUSPENDED',
      description: reason || 'Suspendido por admin',
      severity: 'HIGH',
    },
  });

  res.json({ message: 'Usuario suspendido' });
}

export async function getDisputes(req: AuthRequest, res: Response): Promise<void> {
  const disputes = await prisma.dispute.findMany({
    where: { status: 'OPEN' },
    include: {
      booking: {
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          professional: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          service: { select: { name: true } },
          escrow: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(disputes);
}

export async function resolveDispute(req: AuthRequest, res: Response): Promise<void> {
  const { disputeId } = req.params;
  const { resolution, refundClient } = req.body;

  if (!resolution) {
    res.status(400).json({ error: 'Resolución requerida' });
    return;
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { booking: true },
  });

  if (!dispute) {
    res.status(404).json({ error: 'Disputa no encontrada' });
    return;
  }

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: 'RESOLVED', resolution, resolvedAt: new Date(), resolvedBy: req.user!.userId },
  });

  if (refundClient) {
    await refundEscrow(dispute.bookingId);
    await prisma.booking.update({
      where: { id: dispute.bookingId },
      data: { status: 'CANCELLED' },
    });
  } else {
    await releaseEscrow(dispute.bookingId);
    await prisma.booking.update({
      where: { id: dispute.bookingId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  res.json({ message: `Disputa resuelta. ${refundClient ? 'Reembolso al cliente.' : 'Pago liberado al profesional.'}` });
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  const [
    totalUsers, totalProfessionals, pendingVerifications,
    totalBookings, completedBookings, openDisputes, fraudEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.professionalProfile.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.professionalProfile.count({ where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.fraudEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
  ]);

  const revenue = await prisma.booking.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { platformFee: true },
  });

  res.json({
    totalUsers,
    totalProfessionals,
    pendingVerifications,
    totalBookings,
    completedBookings,
    openDisputes,
    fraudEventsLast24h: fraudEvents,
    platformRevenue: revenue._sum.platformFee || 0,
  });
}

export async function getFraudEvents(req: AuthRequest, res: Response): Promise<void> {
  const events = await prisma.fraudEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
  });

  res.json(events);
}
