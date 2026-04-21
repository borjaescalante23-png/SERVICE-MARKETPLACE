import { Request, Response, NextFunction } from 'express';
import { SENSITIVE_DATA_PATTERNS } from '../config/constants';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth.middleware';

export function detectSensitiveData(req: AuthRequest, res: Response, next: NextFunction): void {
  const body = JSON.stringify(req.body || {});
  const detected: string[] = [];

  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(body)) detected.push(pattern.toString());
  }

  if (detected.length > 0 && req.user) {
    prisma.fraudEvent.create({
      data: {
        userId: req.user.userId,
        eventType: 'SENSITIVE_DATA_IN_MESSAGE',
        description: 'Intento de compartir datos sensibles detectado',
        metadata: JSON.stringify({ patterns: detected.length, path: req.path }),
        severity: 'MEDIUM',
      },
    }).catch(() => {});

    res.status(400).json({
      error: 'Contenido no permitido',
      message: 'No está permitido compartir datos de contacto (teléfono, email, enlaces externos) fuera de la plataforma.',
    });
    return;
  }

  next();
}

export function sanitizeMessageContent(content: string): { clean: string; flagged: boolean; reason?: string } {
  let flagged = false;
  let reason: string | undefined;
  let clean = content;

  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      flagged = true;
      reason = 'Datos sensibles detectados';
      clean = content.replace(pattern, '[DATOS OCULTOS]');
    }
  }

  return { clean, flagged, reason };
}
