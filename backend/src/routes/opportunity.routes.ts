import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getOpportunities, readOpportunity } from '../controllers/opportunity.controller';

const router = Router();

router.get('/', authenticate, getOpportunities);
router.patch('/:id/read', authenticate, readOpportunity);

export default router;
