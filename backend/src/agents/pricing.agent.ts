import prisma from '../utils/prisma';
import { getPricingRecommendation } from '../services/pricing.service';

export interface AIPricingResult {
  min: number;
  max: number;
  suggested: number;
  marketAvg: number;
  warning: 'too_low' | 'too_high' | null;
  message: string;
  aiExplanation: string;
  competitorCount: number;
  pricePercentile: number | null;
}

async function generateAIExplanation(
  category: string,
  suggested: number,
  marketAvg: number,
  currentPrice: number | undefined,
  competitorCount: number,
  level: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    return buildFallbackExplanation(category, suggested, marketAvg, competitorCount);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Eres un experto en pricing de marketplaces de servicios a domicilio en Barcelona (España). Explica brevemente (2-3 frases en español) por qué un profesional de nivel ${level} en la categoría ${category} debería cobrar ${suggested}€ en el mercado de Barcelona. El promedio en Barcelona es ${marketAvg}€, hay ${competitorCount} profesionales activos en la ciudad.${currentPrice ? ` Su precio actual es ${currentPrice}€.` : ''} Sé directo y accionable.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text.trim() : buildFallbackExplanation(category, suggested, marketAvg, competitorCount);
  } catch {
    return buildFallbackExplanation(category, suggested, marketAvg, competitorCount);
  }
}

function buildFallbackExplanation(category: string, suggested: number, marketAvg: number, count: number): string {
  if (count === 0) return `No hay datos de mercado suficientes para ${category}. El precio sugerido de ${suggested}€ se basa en referencias del sector.`;
  const diff = suggested - marketAvg;
  if (Math.abs(diff) < 5) return `El precio sugerido de ${suggested}€ está alineado con el promedio del mercado (${marketAvg}€), basado en ${count} profesionales activos.`;
  if (diff > 0) return `El precio sugerido de ${suggested}€ está ligeramente por encima de la media (${marketAvg}€), reflejando la demanda actual del mercado entre ${count} profesionales.`;
  return `El precio sugerido de ${suggested}€ es competitivo frente a la media del mercado (${marketAvg}€) entre ${count} profesionales activos.`;
}

function computePercentile(prices: number[], target: number): number {
  if (prices.length === 0) return 50;
  const below = prices.filter(p => p < target).length;
  return Math.round((below / prices.length) * 100);
}

export async function getAIPricingRecommendation(
  category: string,
  professionalId?: string,
  currentPrice?: number
): Promise<AIPricingResult> {
  const base = await getPricingRecommendation(category, currentPrice);

  const services = await prisma.service.findMany({
    where: { category, isActive: true },
    select: { price: true },
  });

  const prices = services.map(s => s.price);
  const competitorCount = prices.length;
  const pricePercentile = currentPrice != null ? computePercentile(prices, currentPrice) : null;

  let level = 'VERIFIED';
  if (professionalId) {
    const pro = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: { level: true },
    });
    if (pro) level = pro.level;
  }

  const aiExplanation = await generateAIExplanation(
    category,
    base.suggested,
    base.marketAvg,
    currentPrice,
    competitorCount,
    level
  );

  return {
    ...base,
    aiExplanation,
    competitorCount,
    pricePercentile,
  };
}
