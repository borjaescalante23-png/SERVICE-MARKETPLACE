import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyzeKYC } from '../agents/kyc.agent';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function notifyAdminsManualReview(
  professionalId: string,
  userId: string,
  reason: string,
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (!admins.length) {
      console.error(
        `[KYC] No admin users found to notify about manual review for professional ${professionalId}`,
      );
      return;
    }
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'KYC_MANUAL_REVIEW',
        title: 'Verificacion de identidad pendiente de revision manual',
        body: `El profesional (perfil ${professionalId}) requiere revision manual de identidad. Motivo: ${reason}`,
        data: JSON.stringify({ professionalId, userId }),
        priority: 'HIGH',
        isRead: false,
      })),
    });
  } catch (err) {
    console.error('[KYC] Failed to notify admins of manual review:', err);
  }
}

async function notifyProfessionalKycResult(
  userId: string,
  status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW',
  reason?: string,
): Promise<void> {
  try {
    const content = {
      APPROVED: {
        title: 'Identidad verificada',
        body: 'Tu identidad ha sido verificada correctamente. Ya puedes operar en VELORA.',
        priority: 'HIGH',
      },
      REJECTED: {
        title: 'Verificacion de identidad rechazada',
        body: `No se ha podido verificar tu identidad. ${reason ? `Motivo: ${reason}.` : ''} Por favor, intentalo de nuevo con una foto mas clara.`,
        priority: 'HIGH',
      },
      MANUAL_REVIEW: {
        title: 'Verificacion de identidad en revision',
        body: 'Tu documentacion esta siendo revisada por el equipo de VELORA. Te notificaremos en un plazo de 24-48 horas.',
        priority: 'MEDIUM',
      },
    }[status];

    await prisma.notification.create({
      data: {
        userId,
        type: `KYC_${status}`,
        title: content.title,
        body: content.body,
        priority: content.priority,
        isRead: false,
      },
    });
  } catch (err) {
    console.error('[KYC] Failed to notify professional of KYC result:', err);
  }
}

/**
 * Runs the KYC AI analysis in the background.
 * Guarantees that kycStatus is NEVER left at PROCESSING regardless of what happens:
 *   - Analysis succeeds  → update to APPROVED / REJECTED / MANUAL_REVIEW
 *   - Analysis returns fallback (no API key, file error) → MANUAL_REVIEW + admin notification
 *   - Analysis throws    → MANUAL_REVIEW + admin notification
 */
async function runKYCAnalysis(
  profile: { id: string; userId: string; verificationStatus: string },
  documentUrl: string,
  selfieUrl: string,
  attemptId: string,
): Promise<void> {
  let kycStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

  // ---- Step 1: Run the AI analysis ----------------------------------------
  let result;
  try {
    result = await analyzeKYC(documentUrl, selfieUrl);
    kycStatus = result.overallResult;
  } catch (err: any) {
    // analyzeKYC should never throw (it has internal fallback), but protect anyway
    const errorMsg = err?.message ?? 'Error inesperado en el analisis de identidad';
    console.error('[KYC] analyzeKYC threw unexpectedly, defaulting to MANUAL_REVIEW:', errorMsg);

    kycStatus = 'MANUAL_REVIEW';

    await prisma.$transaction([
      prisma.kycAttempt.update({
        where: { id: attemptId },
        data: {
          result: 'MANUAL_REVIEW',
          aiAnalysis: JSON.stringify({ error: errorMsg }),
          rejectionReason: `Error en analisis automatico: ${errorMsg}`,
          reviewedAt: new Date(),
        },
      }),
      prisma.professionalProfile.update({
        where: { id: profile.id },
        data: { kycStatus: 'MANUAL_REVIEW' },
      }),
    ]);

    await Promise.all([
      notifyAdminsManualReview(profile.id, profile.userId, `Error en analisis automatico: ${errorMsg}`),
      notifyProfessionalKycResult(profile.userId, 'MANUAL_REVIEW'),
    ]);
    return;
  }

  // ---- Step 2: Persist the result atomically ------------------------------
  await prisma.$transaction([
    prisma.kycAttempt.update({
      where: { id: attemptId },
      data: {
        result: kycStatus,
        faceMatchScore: result.faceMatchScore,
        aiAnalysis: JSON.stringify(result),
        rejectionReason: kycStatus !== 'APPROVED' ? result.reasoning : null,
        reviewedAt: new Date(),
      },
    }),
    prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { kycStatus },
    }),
  ]);

  // ---- Step 3: Side-effects per result ------------------------------------

  if (kycStatus === 'MANUAL_REVIEW') {
    await notifyAdminsManualReview(
      profile.id,
      profile.userId,
      result.reasoning || 'Puntuacion de coincidencia facial insuficiente para aprobacion automatica',
    );
  }

  if (kycStatus === 'APPROVED' && profile.verificationStatus === 'UNDER_REVIEW') {
    const idDoc = await prisma.verificationDocument.findFirst({
      where: { professionalId: profile.id, type: { in: ['NATIONAL_ID', 'PASSPORT'] } },
    });
    if (idDoc) {
      await prisma.verificationDocument.update({
        where: { id: idDoc.id },
        data: { status: 'APPROVED' },
      });
    }
  }

  await notifyProfessionalKycResult(
    profile.userId,
    kycStatus,
    kycStatus !== 'APPROVED' ? result.reasoning : undefined,
  );
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function getKYCStatus(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    select: {
      kycStatus: true,
      selfieUrl: true,
      stripeConnectId: true,
      stripeConnectStatus: true,
      documents: {
        where: { type: { in: ['NATIONAL_ID', 'PASSPORT'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      kycAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  res.json(profile);
}

export async function submitKYCSelfie(req: AuthRequest, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Selfie requerido' });
    return;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    include: {
      documents: {
        where: { type: { in: ['NATIONAL_ID', 'PASSPORT'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  const idDocument = profile.documents[0];
  if (!idDocument) {
    res.status(400).json({ error: 'Debes subir tu documento de identidad antes del selfie' });
    return;
  }

  const selfieUrl = `/uploads/kyc/${file.filename}`;

  // Mark as PROCESSING and create the attempt record synchronously
  await prisma.professionalProfile.update({
    where: { id: profile.id },
    data: { selfieUrl, kycStatus: 'PROCESSING' },
  });

  const attempt = await prisma.kycAttempt.create({
    data: {
      professionalId: profile.id,
      documentUrl: idDocument.fileUrl,
      selfieUrl,
      result: 'PROCESSING',
    },
  });

  // Respond immediately so the frontend can start polling
  res.json({ message: 'Selfie recibido. Analizando identidad...', attemptId: attempt.id });

  // Run analysis in background — kycStatus WILL be updated regardless of outcome
  runKYCAnalysis(
    { id: profile.id, userId: req.user!.userId, verificationStatus: profile.verificationStatus },
    idDocument.fileUrl,
    selfieUrl,
    attempt.id,
  ).catch(err => {
    // runKYCAnalysis handles its own errors internally; this is a last-resort guard
    console.error('[KYC] runKYCAnalysis leaked an unhandled error:', err);
    Promise.all([
      prisma.professionalProfile.update({
        where: { id: profile.id },
        data: { kycStatus: 'MANUAL_REVIEW' },
      }),
      prisma.kycAttempt.update({
        where: { id: attempt.id },
        data: { result: 'MANUAL_REVIEW', reviewedAt: new Date() },
      }),
      notifyAdminsManualReview(profile.id, req.user!.userId, 'Error critico no capturado en el pipeline KYC'),
    ]).catch(() => {});
  });
}

export async function getKYCResult(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    select: {
      kycStatus: true,
      kycAttempts: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  res.json(profile);
}
