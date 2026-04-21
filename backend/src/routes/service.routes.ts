import { Router } from 'express';
import { createService, updateService, deleteService } from '../controllers/service.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, requireRole('PROFESSIONAL'), createService);
router.patch('/:serviceId', authenticate, requireRole('PROFESSIONAL'), updateService);
router.delete('/:serviceId', authenticate, requireRole('PROFESSIONAL'), deleteService);

export default router;
