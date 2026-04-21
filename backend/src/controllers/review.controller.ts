import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { recalculateProfessionalStats } from '../services/professional.service';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  qualityScore: z.number().int().min(1).max(5).optional(),
  punctualityScore: z.number().int().min(1).max(5).optional(),
  communicationScore: z.number().int().min(1).max(5).optional(),
});

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  if (booking.clientId !== req.user!.userId) {
    res.status(403).json({ error: 'Solo el cliente puede dejar una reseña' });
    return;
  }

  if (booking.status !== 'COMPLETED') {
    res.status(400).json({
      error: 'Solo se puede reseñar un servicio completado',
      message: 'Las reseñas solo están disponibles para servicios finalizados y pagados.',
    });
    return;
  }

  if (booking.paymentStatus !== 'RELEASED') {
    res.status(400).json({
      error: 'El pago debe estar procesado para dejar una reseña',
    });
    return;
  }

  if (booking.review) {
    res.status(409).json({ error: 'Ya existe una reseña para esta reserva' });
    return;
  }

  const review = await prisma.review.create({
    data: {
      bookingId,
      clientId: req.user!.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      qualityScore: parsed.data.qualityScore,
      punctualityScore: parsed.data.punctualityScore,
      communicationScore: parsed.data.communicationScore,
      isVerified: true,
    },
  });

  await recalculateProfessionalStats(booking.professionalId);

  res.status(201).json({ ...review, message: 'Reseña verificada publicada correctamente.' });
}

export async function getProfessionalReviews(req: AuthRequest, res: Response): Promise<void> {
  const { professionalId } = req.params;
  const { page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        booking: { professionalId },
        isVerified: true,
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, avatarUrl: true } },
        booking: { select: { service: { select: { name: true } }, completedAt: true } },
      },
    }),
    prisma.review.count({ where: { booking: { professionalId }, isVerified: true } }),
  ]);

  res.json({
    data: reviews,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
}
