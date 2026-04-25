import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyzeKYC } from '../agents/kyc.agent';

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

  // Run AI analysis asynchronously
  analyzeKYC(idDocument.fileUrl, selfieUrl).then(async (result) => {
    const kycStatus = result.overallResult === 'APPROVED' ? 'APPROVED'
      : result.overallResult === 'REJECTED' ? 'REJECTED'
      : 'MANUAL_REVIEW';

    await prisma.kycAttempt.update({
      where: { id: attempt.id },
      data: {
        result: kycStatus,
        faceMatchScore: result.faceMatchScore,
        aiAnalysis: JSON.stringify(result),
        rejectionReason: result.overallResult !== 'APPROVED' ? result.reasoning : null,
        reviewedAt: new Date(),
      },
    });

    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { kycStatus },
    });

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
  }).catch(err => console.error('KYC background analysis failed:', err));

  res.json({ message: 'Selfie recibido. Analizando identidad...', attemptId: attempt.id });
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
