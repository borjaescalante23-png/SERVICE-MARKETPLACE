import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { matchProfessionals } from '../agents/matching.agent';
import { getAIPricingRecommendation } from '../agents/pricing.agent';
import { computeTrustScore, getLeaderboard } from '../agents/reputation.agent';
import { translateMessage, detectLanguage } from '../agents/communication.agent';

export async function match(req: Request, res: Response) {
  try {
    const { category, serviceMode, scheduledAt, maxPrice } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'category es requerido' });
    }

    const results = await matchProfessionals({
      category,
      // city is always Barcelona — enforced in the matching agent
      serviceMode,
      scheduledAt,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      clientId: (req as any).user?.userId,
    });

    res.json({ results, total: results.length });
  } catch (err) {
    console.error('match error:', err);
    res.status(500).json({ error: 'Error al calcular coincidencias' });
  }
}

export async function aiPricing(req: Request, res: Response) {
  try {
    const { category, currentPrice } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'category es requerido' });
    }

    const userId = (req as any).user?.userId;
    let professionalId: string | undefined;
    if (userId) {
      const pro = await prisma.professionalProfile.findUnique({ where: { userId }, select: { id: true } });
      professionalId = pro?.id;
    }

    const result = await getAIPricingRecommendation(
      String(category),
      professionalId,
      currentPrice ? Number(currentPrice) : undefined
    );

    res.json(result);
  } catch (err) {
    console.error('ai-pricing error:', err);
    res.status(500).json({ error: 'Error al calcular precio inteligente' });
  }
}

export async function trustScore(req: Request, res: Response) {
  try {
    const { professionalId } = req.params;
    const score = await computeTrustScore(professionalId);
    res.json(score);
  } catch (err: any) {
    if (err.message === 'Professional not found') {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    console.error('trust-score error:', err);
    res.status(500).json({ error: 'Error al calcular trust score' });
  }
}

export async function leaderboard(req: Request, res: Response) {
  try {
    const { category, limit } = req.query;
    const results = await getLeaderboard(
      category ? String(category) : undefined,
      limit ? Number(limit) : 10
    );
    res.json(results);
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
}

export async function translate(req: Request, res: Response) {
  try {
    const { text, from, to } = req.body;

    if (!text || !to) {
      return res.status(400).json({ error: 'text y to son requeridos' });
    }

    const fromLang = from || await detectLanguage(text);
    const result = await translateMessage(text, fromLang, to);
    res.json(result);
  } catch (err) {
    console.error('translate error:', err);
    res.status(500).json({ error: 'Error al traducir mensaje' });
  }
}
