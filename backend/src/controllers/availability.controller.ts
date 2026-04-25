import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getMyAvailability(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }

  const slots = await prisma.availabilitySlot.findMany({
    where: { professionalId: profile.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  res.json(slots);
}

export async function setAvailability(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }

  const { slots } = req.body;
  if (!Array.isArray(slots)) {
    res.status(400).json({ error: 'Se esperaba un array de slots' });
    return;
  }

  // Validate each slot
  for (const s of slots) {
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
      res.status(400).json({ error: 'dayOfWeek debe estar entre 0 y 6' });
      return;
    }
    if (!s.startTime || !s.endTime) {
      res.status(400).json({ error: 'startTime y endTime son requeridos' });
      return;
    }
  }

  // Upsert each slot
  const results = await Promise.all(
    slots.map((s: any) =>
      prisma.availabilitySlot.upsert({
        where: { professionalId_dayOfWeek: { professionalId: profile.id, dayOfWeek: s.dayOfWeek } },
        create: {
          professionalId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable !== false,
        },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable !== false,
        },
      })
    )
  );

  res.json(results);
}

export async function getProfessionalAvailability(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const profile = await prisma.professionalProfile.findUnique({ where: { id } });
  if (!profile || !profile.isVisible) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { professionalId: id, isAvailable: true },
    orderBy: { dayOfWeek: 'asc' },
  });

  res.json(slots);
}
