import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { recalculateProfessionalStats, checkVisibilityEligibility } from '../services/professional.service';
import { MIN_EXPERIENCE_ENTRIES } from '../config/constants';
import path from 'path';

const experienceSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  serviceCategory: z.enum([
    'HAIRDRESSING', 'BEAUTY', 'CLEANING', 'CHEF', 'HANDYMAN',
    'PERSONAL_TRAINER', 'MASSAGE', 'CHILDCARE', 'ELDERCARE', 'PET_CARE', 'TUTORING', 'OTHER',
  ]),
  approximateDate: z.string().min(4).max(50),
});

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      services: { where: { isActive: true } },
      experienceEntries: { include: { images: true } },
      documents: true,
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil profesional no encontrado' });
    return;
  }

  res.json(profile);
}

export async function updateBio(req: AuthRequest, res: Response): Promise<void> {
  const { bio } = req.body;
  if (!bio || bio.length > 500) {
    res.status(400).json({ error: 'Bio inválida (máx. 500 caracteres)' });
    return;
  }

  const profile = await prisma.professionalProfile.update({
    where: { userId: req.user!.userId },
    data: { bio },
  });

  res.json(profile);
}

export async function addExperienceEntry(req: AuthRequest, res: Response): Promise<void> {
  const parsed = experienceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Debes subir al menos 1 imagen del trabajo realizado' });
    return;
  }

  const entry = await prisma.experienceEntry.create({
    data: {
      professionalId: profile.id,
      ...parsed.data,
      images: {
        create: files.map(f => ({
          fileUrl: `/uploads/experience/${f.filename}`,
          originalName: f.originalname,
        })),
      },
    },
    include: { images: true },
  });

  res.status(201).json(entry);
}

export async function deleteExperienceEntry(req: AuthRequest, res: Response): Promise<void> {
  const { entryId } = req.params;

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  const entry = await prisma.experienceEntry.findFirst({
    where: { id: entryId, professionalId: profile.id },
  });

  if (!entry) {
    res.status(404).json({ error: 'Entrada no encontrada' });
    return;
  }

  await prisma.experienceEntry.delete({ where: { id: entryId } });
  res.json({ message: 'Entrada eliminada' });
}

export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  const { type } = req.body;
  const validTypes = ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'PROFESSIONAL_CERTIFICATE', 'WORK_EVIDENCE', 'REFERENCE'];

  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'Tipo de documento inválido' });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Archivo requerido' });
    return;
  }

  const doc = await prisma.verificationDocument.create({
    data: {
      professionalId: profile.id,
      type: type as any,
      fileUrl: `/uploads/documents/${file.filename}`,
      originalName: file.originalname,
    },
  });

  if (profile.verificationStatus === 'PENDING') {
    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: 'UNDER_REVIEW' },
    });
  }

  res.status(201).json(doc);
}

export async function getProfessionals(req: AuthRequest, res: Response): Promise<void> {
  const { category, minRating, page = '1', limit = '12' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    verificationStatus: 'APPROVED',
    isVisible: true,
  };

  if (minRating) {
    where.avgRating = { gte: parseFloat(minRating as string) };
  }

  if (category) {
    where.services = { some: { category: category as any, isActive: true } };
  }

  const [professionals, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ avgRating: 'desc' }, { completedJobs: 'desc' }],
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        services: { where: { isActive: true } },
        experienceEntries: {
          take: 2,
          include: { images: { take: 1 } },
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  res.json({
    data: professionals,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
}

export async function getProfessionalById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true, createdAt: true } },
      services: { where: { isActive: true } },
      experienceEntries: { include: { images: true } },
      bookings: {
        where: { status: 'COMPLETED' },
        include: {
          review: { select: { rating: true, comment: true, createdAt: true } },
          client: { select: { firstName: true, avatarUrl: true } },
        },
        take: 10,
        orderBy: { completedAt: 'desc' },
      },
    },
  });

  if (!professional || !professional.isVisible) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return;
  }

  const reviews = professional.bookings
    .filter(b => b.review)
    .map(b => ({
      ...b.review,
      clientName: b.client.firstName,
      clientAvatar: b.client.avatarUrl,
    }));

  res.json({ ...professional, reviews });
}
