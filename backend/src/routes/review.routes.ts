import { Router } from 'express';
import { createReview, getProfessionalReviews } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/bookings/:bookingId/review', authenticate, requireRole('CLIENT'), createReview);
router.get('/professionals/:professionalId/reviews', authenticate, getProfessionalReviews);

export default router;
