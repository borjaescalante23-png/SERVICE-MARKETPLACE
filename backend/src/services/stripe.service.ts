export async function createCheckoutSession(
  bookingId: string,
  amount: number,
  serviceName: string,
  customerEmail: string
): Promise<{ sessionId: string; checkoutUrl: string }> {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA')) {
    throw new Error('Stripe no configurado. Añade STRIPE_SECRET_KEY en el archivo .env');
  }

  try {
    const { default: Stripe } = await import('stripe' as any);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

    const successUrl = (process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/bookings/{BOOKING_ID}?payment=success')
      .replace('{BOOKING_ID}', bookingId);
    const cancelUrl = (process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/bookings/{BOOKING_ID}?payment=cancelled')
      .replace('{BOOKING_ID}', bookingId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: serviceName, description: 'Reserva VELORA — Pago protegido en escrow' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: { bookingId },
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
    });

    return { sessionId: session.id, checkoutUrl: session.url! };
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error('Instala el paquete stripe con: npm install stripe');
    }
    throw err;
  }
}

async function getStripeForWebhook() {
  // constructEvent is a local HMAC check — the SDK key is not used for network calls here
  const { default: Stripe } = await import('stripe' as any);
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'no-key', { apiVersion: '2024-12-18.acacia' });
}

export async function constructWebhookEvent(payload: Buffer, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET no esta definido en las variables de entorno');
  }
  const stripe = await getStripeForWebhook();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function constructConnectWebhookEvent(payload: Buffer, signature: string) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_CONNECT_WEBHOOK_SECRET no esta definido en las variables de entorno');
  }
  const stripe = await getStripeForWebhook();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
