import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { holdEscrow, releaseEscrow, refundEscrow, partialRefundEscrow } from '../services/escrow.service';
import { recalculateProfessionalStats } from '../services/professional.service';
import { PLATFORM_FEE_PERCENTAGE } from '../config/constants';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.service';
import {
  notifyBookingCreated, notifyBookingAccepted, notifyPaymentHeld,
  notifyProviderMarkedComplete, notifyClientConfirmed, notifyBookingCancelled,
} from '../services/notification.service';
import {
  analyzeDispute, analyzeDisputeHeuristic, executeDisputeResolution,
} from '../agents/dispute.agent';

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  address: z.string().min(5).max(500),
  clientNotes: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  recurringIntervalDays: z.number().int().min(1).max(365).optional(),
  recurringEndDate: z.string().optional(),
});

export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstMsg = Object.values(flat.fieldErrors).flat()[0];
    res.status(400).json({
      error: firstMsg ? `Campo inválido: ${firstMsg}` : 'Datos inválidos',
      details: flat,
    });
    return;
  }

  const scheduledAtStr = parsed.data.scheduledAt.includes('T') && !parsed.data.scheduledAt.endsWith('Z') && !parsed.data.scheduledAt.includes('+')
    ? parsed.data.scheduledAt + ':00.000Z'
    : parsed.data.scheduledAt;

  const scheduledDate = new Date(scheduledAtStr);
  if (isNaN(scheduledDate.getTime())) {
    res.status(400).json({ error: 'Fecha y hora inválidas' });
    return;
  }
  if (scheduledDate <= new Date()) {
    res.status(400).json({ error: 'La fecha del servicio debe ser en el futuro' });
    return;
  }

  const { serviceId, address, clientNotes, isRecurring, recurringFrequency, recurringIntervalDays, recurringEndDate } = parsed.data;
  const scheduledAt = scheduledAtStr;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: true },
  });

  if (!service || !service.isActive) {
    res.status(404).json({ error: 'Servicio no encontrado o inactivo' });
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && service.professional.verificationStatus !== 'APPROVED') {
    res.status(400).json({ error: 'El profesional no está verificado' });
    return;
  }

  if (service.professional.userId === req.user!.userId) {
    res.status(400).json({ error: 'No puedes reservar tu propio servicio' });
    return;
  }

  const platformFee = service.price * PLATFORM_FEE_PERCENTAGE;
  const professionalAmount = service.price - platformFee;

  const recurringEndDateParsed = recurringEndDate ? new Date(recurringEndDate) : undefined;

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
      isRecurring: isRecurring ?? false,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      recurringIntervalDays: isRecurring ? recurringIntervalDays : undefined,
      recurringEndDate: isRecurring ? recurringEndDateParsed : undefined,
    },
    include: {
      service: true,
      professional: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (isRecurring && recurringFrequency) {
    const intervalDays =
      recurringFrequency === 'WEEKLY' ? 7 :
      recurringFrequency === 'BIWEEKLY' ? 14 :
      recurringFrequency === 'MONTHLY' ? 30 :
      (recurringIntervalDays ?? 7);

    const baseDate = new Date(scheduledAt);
    for (let i = 1; i <= 3; i++) {
      const childDate = new Date(baseDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
      if (recurringEndDateParsed && childDate > recurringEndDateParsed) break;
      await prisma.booking.create({
        data: {
          clientId: req.user!.userId,
          professionalId: service.professionalId,
          serviceId,
          scheduledAt: childDate,
          address,
          clientNotes,
          totalAmount: service.price,
          platformFee,
          professionalAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          isRecurring: true,
          recurringFrequency,
          recurringIntervalDays: intervalDays,
          recurringEndDate: recurringEndDateParsed,
          parentBookingId: booking.id,
        },
      });
    }
  }

  // Notify professional about new booking (async, don't block response)
  notifyBookingCreated(booking.id).catch(() => {});

  res.status(201).json(booking);
}

export async function payBooking(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      client: { select: { email: true } },
    },
  });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  if (booking.clientId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'PENDING' || booking.paymentStatus !== 'PENDING') {
    res.status(400).json({ error: 'La reserva no puede ser pagada en su estado actual' });
    return;
  }

  const stripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA');

  if (!stripeConfigured) {
    // Dev mode: mock payment
    await holdEscrow(bookingId, booking.totalAmount);
    notifyPaymentHeld(bookingId).catch(() => {});
    res.json({ mock: true, message: 'Pago simulado en modo desarrollo' });
    return;
  }

  try {
    const { sessionId, checkoutUrl } = await createCheckoutSession(
      bookingId,
      booking.totalAmount,
      booking.service.name,
      booking.client.email
    );

    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripeSessionId: sessionId },
    });

    res.json({ checkoutUrl, sessionId });
  } catch (err: any) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Error al iniciar el pago. Verifica la configuración de Stripe.' });
  }
}

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Cabecera stripe-signature requerida' });
    return;
  }

  let event: any;
  try {
    event = await constructWebhookEvent(req.body as Buffer, signature);
  } catch (err: any) {
    if (err.type === 'StripeSignatureVerificationError') {
      res.status(400).json({ error: 'Firma del webhook invalida' });
    } else {
      console.error('[Stripe Webhook] Error de configuracion:', err.message);
      res.status(500).json({ error: 'Error de configuracion del servidor de pagos' });
    }
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.paymentStatus === 'PENDING') {
          await holdEscrow(bookingId, booking.totalAmount);
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Error procesando evento:', err.message);
    res.status(500).json({ error: 'Error interno al procesar el evento' });
  }
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

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'ACCEPTED' },
    include: {
      service: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });

  notifyBookingAccepted(bookingId).catch(() => {});

  res.json(updated);
}

export async function confirmPayment(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
  if (booking.clientId !== req.user!.userId) { res.status(403).json({ error: 'No autorizado' }); return; }
  if (booking.paymentStatus !== 'PENDING') {
    res.status(400).json({ error: 'El pago ya fue procesado' }); return;
  }

  await holdEscrow(bookingId, booking.totalAmount);
  res.json({ message: 'Pago confirmado y fondos en custodia' });
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

  if (booking.paymentStatus !== 'HELD_IN_ESCROW') {
    res.status(400).json({ error: 'El cliente debe confirmar el pago antes de iniciar el servicio' });
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

export async function providerComplete(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;
  const { evidenceNote } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking || booking.professional.userId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'IN_PROGRESS') {
    res.status(400).json({ error: 'El servicio debe estar en progreso' });
    return;
  }

  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED_BY_PROVIDER',
      completedByProviderAt: now,
      autoReleaseAt,
      providerEvidenceNote: evidenceNote || booking.providerEvidenceNote,
    },
  });

  notifyProviderMarkedComplete(bookingId).catch(() => {});

  res.json({ message: 'Servicio marcado como completado. El cliente tiene 48h para confirmar o disputar.' });
}

export async function clientConfirmCompletion(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking || booking.clientId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'COMPLETED_BY_PROVIDER') {
    res.status(400).json({ error: 'Estado de reserva inválido' });
    return;
  }

  await releaseEscrow(bookingId);
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  await recalculateProfessionalStats(booking.professionalId);

  notifyClientConfirmed(bookingId).catch(() => {});

  res.json({ message: 'Servicio confirmado. Pago liberado al profesional.' });
}

// ---------------------------------------------------------------------------
// Dispute helpers (used only by clientDisputeCompletion)
// ---------------------------------------------------------------------------

const DISPUTE_MAX_AI_ATTEMPTS = 2;

async function notifyAdminsDisputeFailed(
  disputeId: string,
  bookingId: string,
  reason: string,
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (!admins.length) {
      console.error(`[Dispute] No admin users found to notify about failed analysis for dispute ${disputeId}`);
      return;
    }
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'DISPUTE_ANALYSIS_FAILED',
        title: 'Disputa pendiente de revision manual',
        body: `El analisis automatico de la disputa ${disputeId} (booking ${bookingId}) ha fallado tras ${DISPUTE_MAX_AI_ATTEMPTS} intentos y requiere intervencion manual. Motivo: ${reason}`,
        data: JSON.stringify({ disputeId, bookingId, reason }),
        priority: 'HIGH',
        isRead: false,
      })),
    });
  } catch (err) {
    console.error('[Dispute] Failed to notify admins of failed analysis:', err);
  }
}

async function notifyPartiesDisputeManualReview(
  clientId: string,
  professionalUserId: string,
  bookingId: string,
): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: [
        {
          userId: clientId,
          type: 'DISPUTE_MANUAL_REVIEW',
          title: 'Tu disputa esta siendo revisada manualmente',
          body: 'El equipo de VELORA revisara tu disputa en un plazo de 24-48 horas y te notificara con la resolucion.',
          data: JSON.stringify({ bookingId }),
          priority: 'HIGH',
          isRead: false,
        },
        {
          userId: professionalUserId,
          type: 'DISPUTE_MANUAL_REVIEW',
          title: 'Disputa en revision manual',
          body: 'El cliente ha abierto una disputa que sera revisada por el equipo de VELORA. Te notificaremos con la resolucion en 24-48 horas.',
          data: JSON.stringify({ bookingId }),
          priority: 'HIGH',
          isRead: false,
        },
      ],
    });
  } catch (err) {
    console.error('[Dispute] Failed to notify parties of manual review:', err);
  }
}

/**
 * Runs the full dispute analysis pipeline in the background.
 * Guarantees that the dispute never stays in an unresolved limbo:
 *   - AI succeeds          → execute resolution
 *   - AI fails (retries)   → use heuristic + notify admins
 *   - Heuristic also fails → mark dispute MANUAL_REVIEW + notify admins + notify parties
 */
async function runDisputeAnalysis(
  disputeId: string,
  bookingId: string,
  clientId: string,
  professionalUserId: string,
): Promise<void> {
  let lastAiError: string = 'Unknown error';

  // Attempt AI analysis up to DISPUTE_MAX_AI_ATTEMPTS times
  for (let attempt = 1; attempt <= DISPUTE_MAX_AI_ATTEMPTS; attempt++) {
    try {
      const result = await analyzeDispute(disputeId);
      await executeDisputeResolution(disputeId, result);
      return; // success
    } catch (err: any) {
      lastAiError = err?.message ?? 'Unknown error';
      console.error(
        `[Dispute] AI analysis attempt ${attempt}/${DISPUTE_MAX_AI_ATTEMPTS} failed for dispute ${disputeId}: ${lastAiError}`,
      );
    }
  }

  // All AI attempts exhausted — try heuristic as last resort
  console.warn(
    `[Dispute] AI unavailable after ${DISPUTE_MAX_AI_ATTEMPTS} attempts for dispute ${disputeId}. Applying heuristic resolution.`,
  );

  try {
    const heuristicResult = await analyzeDisputeHeuristic(disputeId);
    await executeDisputeResolution(disputeId, heuristicResult);
    // Notify admins that heuristic was used (audit visibility)
    await notifyAdminsDisputeFailed(
      disputeId,
      bookingId,
      `Resolucion aplicada por heuristica tras fallo del agente IA: ${lastAiError}`,
    );
    return;
  } catch (heuristicErr: any) {
    const heuristicMsg = heuristicErr?.message ?? 'Unknown error';
    console.error(
      `[Dispute] Heuristic resolution also failed for dispute ${disputeId}: ${heuristicMsg}`,
    );
  }

  // Both AI and heuristic failed — mark for full manual review
  try {
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'OPEN', resolvedBy: null },
    });
  } catch (updateErr) {
    console.error('[Dispute] Failed to update dispute status to OPEN for manual review:', updateErr);
  }

  await Promise.all([
    notifyAdminsDisputeFailed(
      disputeId,
      bookingId,
      `Fallo critico: ni la IA ni la heuristica pudieron resolver la disputa. Error IA: ${lastAiError}`,
    ),
    notifyPartiesDisputeManualReview(clientId, professionalUserId, bookingId),
  ]);
}

// ---------------------------------------------------------------------------

export async function clientDisputeCompletion(req: AuthRequest, res: Response): Promise<void> {
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

  if (!booking || booking.clientId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  if (booking.status !== 'COMPLETED_BY_PROVIDER') {
    res.status(400).json({ error: 'Solo puedes disputar cuando el proveedor marcó como completado' });
    return;
  }

  const existing = await prisma.dispute.findUnique({ where: { bookingId } });
  if (existing) {
    res.status(409).json({ error: 'Ya existe una disputa para esta reserva' });
    return;
  }

  const dispute = await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: 'DISPUTED' } });
    return tx.dispute.create({
      data: { bookingId, openedBy: req.user!.userId, reason, description },
    });
  });

  // Respond immediately — analysis runs in the background
  res.status(201).json({
    message: 'Disputa abierta. El sistema la analizará automáticamente.',
    disputeId: dispute.id,
  });

  // Fire-and-forget with full error coverage — client/professional are always notified
  runDisputeAnalysis(
    dispute.id,
    bookingId,
    booking.clientId,
    booking.professional.userId,
  ).catch(err => {
    // runDisputeAnalysis handles its own errors; this is the absolute last guard
    console.error('[Dispute] runDisputeAnalysis leaked an unhandled error:', err);
  });
}

export async function submitEvidence(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;
  const { evidenceNote } = req.body;

  if (!evidenceNote?.trim()) {
    res.status(400).json({ error: 'La nota de evidencia es requerida' });
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true },
  });

  if (!booking || booking.professional.userId !== req.user!.userId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { providerEvidenceNote: evidenceNote },
  });

  res.json({ message: 'Evidencia guardada.' });
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

  let refundPolicy = booking.paymentStatus === 'HELD_IN_ESCROW' ? 'full' : 'none_charged';
  if (booking.paymentStatus === 'HELD_IN_ESCROW') {
    const hoursUntil = (booking.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (!isClient) {
      // Professional cancels → always full refund to client
      await refundEscrow(bookingId);
      refundPolicy = 'full';
    } else if (hoursUntil >= 24) {
      await refundEscrow(bookingId);
      refundPolicy = 'full';
    } else if (hoursUntil >= 2) {
      // 50% refund to client, 50% to professional
      await partialRefundEscrow(bookingId, booking.totalAmount * 0.5);
      refundPolicy = 'partial';
    } else {
      // No refund — release to professional
      await releaseEscrow(bookingId);
      refundPolicy = 'none';
    }
  }

  notifyBookingCancelled(bookingId, req.user!.userId, refundPolicy).catch(() => {});
  await recalculateProfessionalStats(booking.professionalId);

  const messages: Record<string, string> = {
    full: 'Reserva cancelada. Reembolso completo al cliente.',
    partial: 'Reserva cancelada. Reembolso del 50% (cancelación con menos de 24h).',
    none: 'Reserva cancelada. Sin reembolso (cancelación con menos de 2h).',
    none_charged: 'Reserva cancelada.',
  };
  res.json({ message: messages[refundPolicy] || 'Reserva cancelada.' });
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
  const { status, role: roleFilter } = req.query;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const statusFilter = status ? { status: status as string } : {};

  // Build OR conditions: show bookings where user is the client OR the professional
  const orConditions: any[] = [{ clientId: userId }];

  const profile = await prisma.professionalProfile.findUnique({ where: { userId } });
  if (profile) {
    orConditions.push({ professionalId: profile.id });
  }

  // If a specific role filter is passed in query, narrow down
  let where: any;
  if (roleFilter === 'client') {
    where = { clientId: userId, ...statusFilter };
  } else if (roleFilter === 'professional' && profile) {
    where = { professionalId: profile.id, ...statusFilter };
  } else {
    // Default: show all bookings for this user (as client or professional)
    where = { OR: orConditions, ...statusFilter };
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

export async function getRecurringBookings(req: AuthRequest, res: Response): Promise<void> {
  const { bookingId } = req.params;

  const parent = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!parent) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  const isParticipant =
    parent.clientId === req.user!.userId ||
    req.user!.role === 'ADMIN';

  if (!isParticipant) {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile || profile.id !== parent.professionalId) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }
  }

  const children = await prisma.booking.findMany({
    where: { parentBookingId: bookingId },
    orderBy: { scheduledAt: 'asc' },
    include: { service: { select: { name: true, category: true } } },
  });

  res.json(children);
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
      dispute: { include: { aiAnalysis: true } },
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
