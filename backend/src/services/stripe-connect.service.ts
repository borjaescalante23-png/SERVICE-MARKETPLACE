async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA')) {
    throw new Error('Stripe no configurado. Añade STRIPE_SECRET_KEY en el archivo .env');
  }
  const { default: Stripe } = await import('stripe' as any);
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
}

export async function createConnectAccount(email: string, country = 'ES'): Promise<string> {
  const stripe = await getStripe();
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  });
  return account.id;
}

export async function createOnboardingLink(connectAccountId: string): Promise<string> {
  const stripe = await getStripe();
  const base = process.env.FRONTEND_URL || 'http://localhost:5176';
  const link = await stripe.accountLinks.create({
    account: connectAccountId,
    refresh_url: `${base}/stripe/onboarding?refresh=true`,
    return_url: `${base}/stripe/onboarding?success=true`,
    type: 'account_onboarding',
  });
  return link.url;
}

export async function getConnectAccountStatus(connectAccountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const stripe = await getStripe();
  const account = await stripe.accounts.retrieve(connectAccountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

export async function transferToProvider(
  connectAccountId: string,
  amountEur: number,
  bookingId: string
): Promise<string> {
  const stripe = await getStripe();
  const transfer = await stripe.transfers.create({
    amount: Math.round(amountEur * 100),
    currency: 'eur',
    destination: connectAccountId,
    metadata: { bookingId },
  });
  return transfer.id;
}

export async function refundPaymentIntent(paymentIntentId: string): Promise<void> {
  const stripe = await getStripe();
  await stripe.refunds.create({ payment_intent: paymentIntentId });
}

export async function getConnectBalance(connectAccountId: string): Promise<{
  available: number;
  pending: number;
  currency: string;
}> {
  const stripe = await getStripe();
  const balance = await stripe.balance.retrieve({ stripeAccount: connectAccountId });
  const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
  const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
  const currency = balance.available[0]?.currency ?? 'eur';
  return { available: available / 100, pending: pending / 100, currency };
}

export async function createPayout(connectAccountId: string): Promise<{ id: string; amount: number; currency: string }> {
  const stripe = await getStripe();
  const balance = await stripe.balance.retrieve({ stripeAccount: connectAccountId });
  const availableEur = balance.available.find((b) => b.currency === 'eur');
  if (!availableEur || availableEur.amount <= 0) {
    throw new Error('No hay saldo disponible para retirar');
  }
  const payout = await stripe.payouts.create(
    { amount: availableEur.amount, currency: 'eur' },
    { stripeAccount: connectAccountId }
  );
  return { id: payout.id, amount: payout.amount / 100, currency: payout.currency };
}
