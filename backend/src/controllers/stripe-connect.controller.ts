import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createConnectAccount,
  createOnboardingLink,
  getConnectAccountStatus,
} from '../services/stripe-connect.service';

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

export async function stripeConnectWebhook(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body as Buffer;
  const signature = req.headers['stripe-signature'] as string;

  try {
    const { default: Stripe } = await import('stripe' as any);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET || '');

    if (event.type === 'account.updated') {
      const account = event.data.object as any;
      const newStatus = account.charges_enabled ? 'ACTIVE' : account.details_submitted ? 'PENDING' : 'INCOMPLETE';

      await prisma.professionalProfile.updateMany({
        where: { stripeConnectId: account.id },
        data: { stripeConnectStatus: newStatus },
      });
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
}
