import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

const serviceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.enum([
    'HAIRDRESSING', 'BEAUTY', 'CLEANING', 'CHEF', 'HANDYMAN',
    'PERSONAL_TRAINER', 'MASSAGE', 'ELDERCARE', 'PET_CARE',
    'TUTORING', 'PLUMBING', 'ELECTRICIAN', 'GARDENING',
  ]),
  price: z.number().positive().max(10000),
  duration: z.number().int().positive().max(480),
});

export async function createService(req: AuthRequest, res: Response): Promise<void> {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil profesional no encontrado' });
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && profile.verificationStatus !== 'APPROVED') {
    res.status(403).json({ error: 'Tu perfil debe estar aprobado para crear servicios' });
    return;
  }

  const service = await prisma.service.create({
    data: { ...parsed.data, professionalId: profile.id },
  });

  res.status(201).json(service);
}

export async function updateService(req: AuthRequest, res: Response): Promise<void> {
  const { serviceId } = req.params;
  const parsed = serviceSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(403).json({ error: 'Perfil profesional no encontrado' });
    return;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: profile.id },
  });

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: parsed.data,
  });

  res.json(updated);
}

export async function deleteService(req: AuthRequest, res: Response): Promise<void> {
  const { serviceId } = req.params;

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: profile?.id },
  });

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  await prisma.service.update({ where: { id: serviceId }, data: { isActive: false } });
  res.json({ message: 'Servicio desactivado' });
}
