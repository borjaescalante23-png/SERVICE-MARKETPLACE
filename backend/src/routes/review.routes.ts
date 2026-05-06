import { Router } from 'express';
import { createReview, getProfessionalReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/bookings/:bookingId/review', authenticate, createReview);
router.get('/professionals/:professionalId/reviews', authenticate, getProfessionalReviews);

export default router;
