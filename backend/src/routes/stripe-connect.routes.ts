import { Router } from 'express';
import { startOnboarding, getConnectStatus, stripeConnectWebhook, getBalance, requestPayout } from '../controllers/stripe-connect.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook/connect', stripeConnectWebhook as any);
router.post('/onboard', authenticate, requireRole('PROFESSIONAL'), startOnboarding);
router.get('/status', authenticate, requireRole('PROFESSIONAL'), getConnectStatus);
router.get('/balance', authenticate, requireRole('PROFESSIONAL'), getBalance);
router.post('/payout', authenticate, requireRole('PROFESSIONAL'), requestPayout);

export default router;
