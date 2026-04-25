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
