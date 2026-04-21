import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { holdEscrow, releaseEscrow, refundEscrow } from '../services/escrow.service';
import { recalculateProfessionalStats } from '../services/professional.service';
import { PLATFORM_FEE_PERCENTAGE } from '../config/constants';

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  address: z.string().min(5).max(300),
  clientNotes: z.string().max(500).optional(),
});

export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const { serviceId, scheduledAt, address, clientNotes } = parsed.data;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: true },
  });

  if (!service || !service.isActive) {
    res.status(404).json({ error: 'Servicio no encontrado o inactivo' });
    return;
  }

  if (service.professional.verificationStatus !== 'APPROVED') {
    res.status(400).json({ error: 'El profesional no está verificado' });
    return;
  }

  if (service.professional.userId === req.user!.userId) {
    res.status(400).json({ error: 'No puedes reservar tu propio servicio' });
    return;
  }

  const platformFee = service.price * PLATFORM_FEE_PERCENTAGE;
  const professionalAmount = service.price - platformFee;

  const booking = await prisma.booking.create({
    data: {
      clientId: req.user!.userId,
      professionalId: service.professionalId,
      serviceId,
      scheduledAt: new Date(scheduledAt),
      address,
      clientNotes,
      totalAmount: service.price,
      platformFee,
      professionalAmount,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
    include: {
      service: true,
      professional: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  res.status(201).json(booking);
}

export async function payBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  if (booking.clientId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'PENDING') {
    res.status(400).json({ error: 'La reserva no está en estado pendiente' });
    return;
  }

  if (booking.paymentStatus !== 'PENDING') {
    res.status(400).json({ error: 'El pago ya fue procesado' });
    return;
  }

  await holdEscrow(bookingId, booking.totalAmount);

  res.json({ message: 'Pago procesado. Fondos en escrow hasta completar el servicio.', bookingId });
}

export async function acceptBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  if (booking.professional.userId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'PENDING') {
    res.status(400).json({ error: 'La reserva no puede ser aceptada en este estado' });
    return;
  }

  if (booking.paymentStatus !== 'HELD_IN_ESCROW') {
    res.status(400).json({ error: 'El cliente debe pagar antes de aceptar' });
    return;
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'ACCEPTED' },
  });

  res.json(updated);
}

export async function startBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking || booking.professional.userId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'ACCEPTED') {
    res.status(400).json({ error: 'La reserva debe estar aceptada antes de iniciar' });
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

  res.json({ message: 'Servicio iniciado' });
}

export async function completeBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  const isProfessional = booking.professional.userId === req.user!.userId;
  const isClient = booking.clientId === req.user!.userId;

  if (!isProfessional && !isClient) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'IN_PROGRESS' && booking.status !== 'ACCEPTED') {
    res.status(400).json({ error: 'El servicio no está en progreso' });
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  await releaseEscrow(bookingId);
  await recalculateProfessionalStats(booking.professionalId);

  res.json({ message: 'Servicio completado. Pago liberado al profesional.' });
}

export async function cancelBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  const isClient = booking.clientId === req.user!.userId;
  const isProfessional = booking.professional.userId === req.user!.userId;

  if (!isClient && !isProfessional) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(booking.status)) {
    res.status(400).json({ error: 'No se puede cancelar en este estado' });
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: req.user!.userId,
      cancellationReason: reason,
    },
  });

  if (booking.paymentStatus === 'HELD_IN_ESCROW') {
    await refundEscrow(bookingId);
  }

  await recalculateProfessionalStats(booking.professionalId);

  res.json({ message: 'Reserva cancelada. Fondos devueltos al cliente.' });
}

export async function openDispute(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;
  const { reason, description } = req.body;

  if (!reason || !description) {
    res.status(400).json({ error: 'Motivo y descripción requeridos' });
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  const isParticipant =
    booking.clientId === req.user!.userId ||
    booking.professional.userId === req.user!.userId;

  if (!isParticipant) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const existing = await prisma.dispute.findUnique({ where: { bookingId } });
  if (existing) {
    res.status(409).json({ error: 'Ya existe una disputa para esta reserva' });
    return;
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'DISPUTED' } }),
    prisma.dispute.create({
      data: { bookingId, openedBy: req.user!.userId, reason, description },
    }),
  ]);

  res.status(201).json({ message: 'Disputa abierta. El equipo la revisará en 24-48h.' });
}

export async function getMyBookings(req: AuthRequest, res: Response): Promise<void> {
  const { status, role } = req.query;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const where: any = {};
  if (status) where.status = status;

  if (userRole === 'CLIENT') {
    where.clientId = userId;
  } else if (userRole === 'PROFESSIONAL') {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.json([]);
      return;
    }
    where.professionalId = profile.id;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      service: { select: { name: true, category: true } },
      client: { select: { firstName: true, lastName: true, avatarUrl: true } },
      professional: {
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
      review: true,
      escrow: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(bookings);
}

export async function getBookingById(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      client: { select: { firstName: true, lastName: true, avatarUrl: true } },
      professional: {
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
      review: true,
      escrow: true,
      dispute: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { firstName: true, role: true } } },
      },
    },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  const isParticipant =
    booking.clientId === req.user!.userId ||
    booking.professional.userId === req.user!.userId ||
    req.user!.role === 'ADMIN';

  if (!isParticipant) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  res.json(booking);
}
