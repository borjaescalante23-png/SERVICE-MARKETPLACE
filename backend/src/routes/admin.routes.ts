import { Router } from 'express';
import {
  getPendingProfessionals, approveProfessional, rejectProfessional,
  suspendUser, getDisputes, resolveDispute, getDashboardStats, getFraudEvents,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/professionals/pending', getPendingProfessionals);
router.post('/professionals/:professionalId/approve', approveProfessional);
router.post('/professionals/:professionalId/reject', rejectProfessional);
router.post('/users/:userId/suspend', suspendUser);
router.get('/disputes', getDisputes);
router.post('/disputes/:disputeId/resolve', resolveDispute);
router.get('/fraud-events', getFraudEvents);

export default router;
