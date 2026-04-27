import prisma from '../utils/prisma';

export interface PricingRecommendation {
  min: number;
  max: number;
  suggested: number;
  marketAvg: number;
  warning: 'too_low' | 'too_high' | null;
  message: string;
}

const BASE_RANGES: Record<string, [number, number]> = {
  PLUMBING: [40, 120],
  ELECTRICIAN: [45, 130],
  GARDENING: [25, 80],
  CLEANING: [20, 70],
  HANDYMAN: [30, 100],
  CHEF: [60, 200],
  HAIRDRESSING: [25, 90],
  BEAUTY: [30, 100],
  MASSAGE: [40, 120],
  PERSONAL_TRAINER: [35, 100],
  CHILDCARE: [12, 25],
  ELDERCARE: [12, 22],
  PET_CARE: [15, 45],
  TUTORING: [20, 60],
};

export async function getPricingRecommendation(
  category: string,
  currentPrice?: number
): Promise<PricingRecommendation> {
  const services = await prisma.service.findMany({
    where: { category, isActive: true },
    select: { price: true },
  });

  const base = BASE_RANGES[category] || [20, 80];
  let min = base[0];
  let max = base[1];
  let marketAvg = (min + max) / 2;

  if (services.length >= 3) {
    const prices = services.map(s => s.price);
    marketAvg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    min = Math.round(Math.min(...prices) * 0.9);
    max = Math.round(Math.max(...prices) * 1.1);
  }

  const suggested = Math.round(marketAvg);

  let warning: 'too_low' | 'too_high' | null = null;
  let message = `Precio recomendado basado en ${services.length} servicios similares en VELORA.`;

  if (currentPrice !== undefined) {
    if (currentPrice < min * 0.7) {
      warning = 'too_low';
      message = `Tu precio está muy por debajo del mercado. Esto puede restar percepción de calidad.`;
    } else if (currentPrice > max * 1.3) {
      warning = 'too_high';
      message = `Tu precio está por encima de la media del mercado. Puede reducir tu tasa de contratación.`;
    } else {
      message = `Tu precio está en el rango competitivo del mercado.`;
    }
  }

  return { min, max, suggested, marketAvg, warning, message };
}
