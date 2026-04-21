import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sanitizeMessageContent } from '../middleware/antifraud.middleware';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;
  const parsed = messageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Contenido inválido' });
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

  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    res.status(400).json({ error: 'No se puede enviar mensajes en una reserva finalizada' });
    return;
  }

  const isParticipant =
    booking.clientId === req.user!.userId ||
    booking.professional.userId === req.user!.userId;

  if (!isParticipant) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const { clean, flagged, reason } = sanitizeMessageContent(parsed.data.content);

  if (flagged && req.user) {
    await prisma.fraudEvent.create({
      data: {
        userId: req.user.userId,
        eventType: 'SENSITIVE_DATA_IN_MESSAGE',
        description: 'Intento de compartir datos sensibles en chat',
        metadata: JSON.stringify({ bookingId, reason }),
        severity: 'MEDIUM',
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      bookingId,
      senderId: req.user!.userId,
      content: clean,
      isFlagged: flagged,
      flagReason: reason,
    },
    include: {
      sender: { select: { firstName: true, role: true, avatarUrl: true } },
    },
  });

  if (flagged) {
    res.json({
      ...message,
      warning: 'Tu mensaje contenía datos de contacto que han sido eliminados por seguridad.',
    });
    return;
  }

  res.status(201).json(message);
}

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

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
    booking.professional.userId === req.user!.userId ||
    req.user!.role === 'ADMIN';

  if (!isParticipant) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { firstName: true, role: true, avatarUrl: true } },
    },
  });

  await prisma.message.updateMany({
    where: { bookingId, senderId: { not: req.user!.userId }, isRead: false },
    data: { isRead: true },
  });

  res.json(messages);
}
