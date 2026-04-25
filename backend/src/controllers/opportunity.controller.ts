import { Request, Response } from 'express';
import { getUserOpportunities, markOpportunityRead } from '../agents/opportunity.agent';

export async function getOpportunities(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const opportunities = await getUserOpportunities(userId);
    res.json(opportunities);
  } catch (err) {
    console.error('get-opportunities error:', err);
    res.status(500).json({ error: 'Error al obtener oportunidades' });
  }
}

export async function readOpportunity(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    await markOpportunityRead(id, userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('read-opportunity error:', err);
    res.status(500).json({ error: 'Error al marcar oportunidad' });
  }
}
