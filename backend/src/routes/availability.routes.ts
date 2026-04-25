import { Router } from 'express';
import { getMyAvailability, setAvailability, getProfessionalAvailability } from '../controllers/availability.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/me/availability', authenticate, requireRole('PROFESSIONAL'), getMyAvailability);
router.put('/me/availability', authenticate, requireRole('PROFESSIONAL'), setAvailability);
router.get('/:id/availability', authenticate, getProfessionalAvailability);

export default router;
