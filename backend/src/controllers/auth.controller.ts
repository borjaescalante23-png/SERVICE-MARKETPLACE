import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma';
import {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['CLIENT', 'PROFESSIONAL']).default('CLIENT'),
  isProvider: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const { email, password, firstName, lastName, role, isProvider: wantsProvider } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const isProvider = wantsProvider || role === 'PROFESSIONAL';
  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, role, isProvider },
  });

  if (isProvider) {
    await prisma.professionalProfile.create({ data: { userId: user.id } });
  }

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await saveRefreshToken(user.id, refreshToken);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, isProvider: user.isProvider },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await saveRefreshToken(user.id, refreshToken);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, isProvider: user.isProvider },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token requerido' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token inválido o expirado' });
      return;
    }

    const tokens = await rotateRefreshToken(refreshToken, payload);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ message: 'Sesión cerrada correctamente' });
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Imagen requerida' });
    return;
  }

  const avatarUrl = `/uploads/avatars/${file.filename}`;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { avatarUrl },
    select: { id: true, avatarUrl: true },
  });

  res.json(user);
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: 'Todos los campos son obligatorios' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Las contraseñas no coinciden' });
    return;
  }

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPassword.test(newPassword)) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  // Invalidate all refresh tokens after password change
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  res.json({ message: 'Contraseña actualizada correctamente. Inicia sesión de nuevo.' });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true,
      phone: true, avatarUrl: true, isVerified: true, isProvider: true, createdAt: true,
      professionalProfile: {
        select: {
          id: true, verificationStatus: true, avgRating: true, totalReviews: true,
          completedJobs: true, isVisible: true, bio: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json(user);
}

export async function toggleProvider(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const newValue = !user.isProvider;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isProvider: newValue, role: newValue ? 'PROFESSIONAL' : 'CLIENT' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isProvider: true, avatarUrl: true, isVerified: true, createdAt: true },
  });

  if (newValue) {
    const existing = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await prisma.professionalProfile.create({ data: { userId: user.id } });
    }
  }

  res.json(updated);
}
