import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { PLATFORM_CITY, PLATFORM_COUNTRY_CODE } from '../config/constants';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  const { page = '1', unreadOnly } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const skip = (pageNum - 1) * 20;

  const where: any = { userId: req.user!.userId };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip,
    }),
    prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
  ]);

  res.json({ notifications, unreadCount });
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Todas marcadas como leídas' });
    return;
  }

  const notif = await prisma.notification.findFirst({
    where: { id, userId: req.user!.userId },
  });

  if (!notif) {
    res.status(404).json({ error: 'Notificación no encontrada' });
    return;
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  res.json({ message: 'Marcada como leída' });
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'Todas marcadas como leídas' });
}

export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });
  res.json({ count });
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  const { theme, language, notifSettings } = req.body;

  const data: any = {};
  if (theme) data.theme = theme;
  if (language) data.language = language;
  if (notifSettings !== undefined) data.notifSettings = JSON.stringify(notifSettings);

  await prisma.user.update({ where: { id: req.user!.userId }, data });
  res.json({ message: 'Preferencias guardadas' });
}

export async function updateLocation(req: AuthRequest, res: Response): Promise<void> {
  const { city } = req.body;

  // Platform is Barcelona-only: reject non-Barcelona locations
  if (city && !city.toLowerCase().includes('barcelona')) {
    res.status(400).json({
      error: `La plataforma solo opera en ${PLATFORM_CITY}. Por favor, indica una dirección dentro de Barcelona.`,
    });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil profesional no encontrado' });
    return;
  }

  await prisma.professionalProfile.update({
    where: { userId: req.user!.userId },
    data: {
      city: PLATFORM_CITY,
      country: PLATFORM_COUNTRY_CODE,
    },
  });

  res.json({ message: `Ubicación actualizada: ${PLATFORM_CITY}` });
}
