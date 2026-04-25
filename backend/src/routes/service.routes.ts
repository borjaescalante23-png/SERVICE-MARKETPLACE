import { Router, Request, Response } from 'express';
import { createService, updateService, deleteService } from '../controllers/service.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getPricingRecommendation } from '../services/pricing.service';

const router = Router();

router.get('/pricing/:category', authenticate, async (req: Request, res: Response) => {
  const { category } = req.params;
  const currentPrice = req.query.price ? parseFloat(req.query.price as string) : undefined;
  const recommendation = await getPricingRecommendation(category, currentPrice);
  res.json(recommendation);
});

router.post('/', authenticate, requireRole('PROFESSIONAL'), createService);
router.patch('/:serviceId', authenticate, requireRole('PROFESSIONAL'), updateService);
router.delete('/:serviceId', authenticate, requireRole('PROFESSIONAL'), deleteService);

export default router;
