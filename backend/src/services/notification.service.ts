import prisma from '../utils/prisma';

export type NotificationType =
  | 'NEW_MESSAGE' | 'BOOKING_CREATED' | 'BOOKING_ACCEPTED' | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED' | 'PAYMENT_HELD' | 'PAYMENT_RELEASED' | 'PAYMENT_REFUNDED'
  | 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED' | 'LEVEL_UP' | 'DISPUTE_OPENED'
  | 'PROVIDER_MARKED_COMPLETE' | 'CLIENT_CONFIRMED' | 'DISPUTE_RESOLVED';

const PRIORITIES: Record<NotificationType, 'HIGH' | 'MEDIUM' | 'LOW'> = {
  NEW_MESSAGE: 'LOW',
  BOOKING_CREATED: 'HIGH',
  BOOKING_ACCEPTED: 'HIGH',
  BOOKING_COMPLETED: 'HIGH',
  BOOKING_CANCELLED: 'HIGH',
  PAYMENT_HELD: 'HIGH',
  PAYMENT_RELEASED: 'HIGH',
  PAYMENT_REFUNDED: 'HIGH',
  VERIFICATION_APPROVED: 'HIGH',
  VERIFICATION_REJECTED: 'HIGH',
  LEVEL_UP: 'MEDIUM',
  DISPUTE_OPENED: 'HIGH',
  PROVIDER_MARKED_COMPLETE: 'HIGH',
  CLIENT_CONFIRMED: 'HIGH',
  DISPUTE_RESOLVED: 'HIGH',
};

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
      priority: PRIORITIES[type] || 'MEDIUM',
    },
  });
}

export async function notifyBookingCreated(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      client: { select: { firstName: true, lastName: true } },
      professional: { include: { user: { select: { id: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.professional.user.id,
    'BOOKING_CREATED',
    'Nueva reserva recibida',
    `${booking.client.firstName} ${booking.client.lastName} ha reservado "${booking.service.name}"`,
    { bookingId }
  );
}

export async function notifyPaymentHeld(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      professional: { include: { user: { select: { id: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.professional.user.id,
    'PAYMENT_HELD',
    'Pago retenido en escrow',
    `El pago de ${booking.totalAmount}€ por "${booking.service.name}" está protegido. Acepta la reserva para continuar.`,
    { bookingId }
  );
}

export async function notifyPaymentReleased(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      professional: { include: { user: { select: { id: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.professional.user.id,
    'PAYMENT_RELEASED',
    'Pago liberado',
    `Has recibido ${booking.professionalAmount.toFixed(2)}€ por "${booking.service.name}"`,
    { bookingId }
  );
}

export async function notifyBookingAccepted(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      professional: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.clientId,
    'BOOKING_ACCEPTED',
    'Reserva aceptada',
    `${booking.professional.user.firstName} ha aceptado tu reserva de "${booking.service.name}". El servicio está confirmado.`,
    { bookingId }
  );
}

export async function notifyProviderMarkedComplete(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      professional: { include: { user: { select: { firstName: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.clientId,
    'PROVIDER_MARKED_COMPLETE',
    'Servicio marcado como completado',
    `${booking.professional.user.firstName} ha marcado "${booking.service.name}" como completado. Tienes 48h para confirmar o disputar.`,
    { bookingId }
  );
}

export async function notifyClientConfirmed(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      professional: { include: { user: { select: { id: true } } } },
    },
  });
  if (!booking) return;

  await createNotification(
    booking.professional.user.id,
    'CLIENT_CONFIRMED',
    'Trabajo confirmado — pago liberado',
    `El cliente ha confirmado la finalización de "${booking.service.name}". Recibirás ${booking.professionalAmount.toFixed(2)}€.`,
    { bookingId }
  );
}

export async function notifyBookingCancelled(bookingId: string, cancelledByUserId: string, refundPolicy?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      client: { select: { firstName: true, lastName: true } },
      professional: { include: { user: { select: { id: true, firstName: true } } } },
    },
  });
  if (!booking) return;

  const cancelledByClient = booking.clientId === cancelledByUserId;

  if (cancelledByClient) {
    // Notify professional
    await createNotification(
      booking.professional.user.id,
      'BOOKING_CANCELLED',
      'Reserva cancelada por el cliente',
      `${booking.client.firstName} ${booking.client.lastName} ha cancelado la reserva de "${booking.service.name}".`,
      { bookingId }
    );
  } else {
    // Notify client
    const refundText = refundPolicy === 'full' ? 'Recibirás el reembolso completo.' : '';
    await createNotification(
      booking.clientId,
      'BOOKING_CANCELLED',
      'Reserva cancelada por el profesional',
      `${booking.professional.user.firstName} ha cancelado la reserva de "${booking.service.name}". ${refundText}`,
      { bookingId }
    );
  }
}

export async function notifyLevelUp(professionalId: string, newLevel: string) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    include: { user: { select: { id: true } } },
  });
  if (!profile) return;

  const labels: Record<string, string> = { PRO: 'Pro', ELITE: 'Elite' };
  await createNotification(
    profile.user.id,
    'LEVEL_UP',
    `Nivel ${labels[newLevel] || newLevel} desbloqueado`,
    `Felicidades, has alcanzado el nivel ${labels[newLevel] || newLevel}. Tu perfil tendrá mayor visibilidad.`,
    { newLevel }
  );
}
