import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { match, aiPricing, trustScore, leaderboard, translate } from '../controllers/match.controller';

const router = Router();

router.post('/match', authenticate, match);
router.get('/ai-pricing', authenticate, aiPricing);
router.get('/trust/:professionalId', trustScore);
router.get('/leaderboard', leaderboard);
router.post('/translate', authenticate, translate);

export default router;
