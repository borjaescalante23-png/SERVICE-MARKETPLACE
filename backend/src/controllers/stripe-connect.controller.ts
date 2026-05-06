import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createConnectAccount,
  createOnboardingLink,
  getConnectAccountStatus,
  getConnectBalance,
  createPayout,
} from '../services/stripe-connect.service';
import { constructConnectWebhookEvent } from '../services/stripe.service';

export async function startOnboarding(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { professionalProfile: true },
  });

  if (!user || !user.professionalProfile) {
    res.status(404).json({ error: 'Perfil profesional no encontrado' });
    return;
  }

  const profile = user.professionalProfile;

  try {
    let connectId = profile.stripeConnectId;

    if (!connectId) {
      connectId = await createConnectAccount(user.email);
      await prisma.professionalProfile.update({
        where: { id: profile.id },
        data: { stripeConnectId: connectId, stripeConnectStatus: 'PENDING' },
      });
    }

    const onboardingUrl = await createOnboardingLink(connectId);
    res.json({ onboardingUrl });
  } catch (err: any) {
    console.error('Stripe Connect error:', err.message);
    res.status(503).json({ error: err.message || 'Error al iniciar onboarding de Stripe' });
  }
}

export async function getConnectStatus(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    select: { stripeConnectId: true, stripeConnectStatus: true },
  });

  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
    return;
  }

  if (!profile.stripeConnectId) {
    res.json({ status: 'NOT_STARTED', chargesEnabled: false });
    return;
  }

  try {
    const status = await getConnectAccountStatus(profile.stripeConnectId);
    const newStatus = status.chargesEnabled ? 'ACTIVE' : status.detailsSubmitted ? 'PENDING' : 'INCOMPLETE';

    if (newStatus !== profile.stripeConnectStatus) {
      await prisma.professionalProfile.update({
        where: { userId: req.user!.userId },
        data: { stripeConnectStatus: newStatus },
      });
    }

    res.json({ status: newStatus, ...status });
  } catch (err: any) {
    res.json({ status: profile.stripeConnectStatus, chargesEnabled: false });
  }
}

export async function getBalance(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    select: { stripeConnectId: true, stripeConnectStatus: true },
  });

  if (!profile?.stripeConnectId || profile.stripeConnectStatus !== 'ACTIVE') {
    res.status(400).json({ error: 'Cuenta Stripe no activa' });
    return;
  }

  try {
    const balance = await getConnectBalance(profile.stripeConnectId);
    res.json(balance);
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'Error al obtener el saldo' });
  }
}

export async function requestPayout(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.user!.userId },
    select: { stripeConnectId: true, stripeConnectStatus: true },
  });

  if (!profile?.stripeConnectId || profile.stripeConnectStatus !== 'ACTIVE') {
    res.status(400).json({ error: 'Cuenta Stripe no activa' });
    return;
  }

  try {
    const payout = await createPayout(profile.stripeConnectId);
    res.json(payout);
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'Error al solicitar el pago' });
  }
}

export async function stripeConnectWebhook(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body as Buffer;
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Cabecera stripe-signature requerida' });
    return;
  }

  let event: any;
  try {
    event = await constructConnectWebhookEvent(payload, signature);
  } catch (err: any) {
    if (err.type === 'StripeSignatureVerificationError') {
      res.status(400).json({ error: 'Firma del webhook invalida' });
    } else {
      console.error('[Stripe Connect Webhook] Error de configuracion:', err.message);
      res.status(500).json({ error: 'Error de configuracion del servidor de pagos' });
    }
    return;
  }

  try {
    if (event.type === 'account.updated') {
      const account = event.data.object as any;
      const newStatus = account.charges_enabled
        ? 'ACTIVE'
        : account.details_submitted
          ? 'PENDING'
          : 'INCOMPLETE';

      await prisma.professionalProfile.updateMany({
        where: { stripeConnectId: account.id },
        data: { stripeConnectStatus: newStatus },
      });
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Connect Webhook] Error procesando evento:', err.message);
    res.status(500).json({ error: 'Error interno al procesar el evento' });
  }
}
