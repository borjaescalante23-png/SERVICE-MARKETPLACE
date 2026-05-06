import { Router } from 'express';
import {
  createBooking, payBooking, confirmPayment, stripeWebhook, acceptBooking, startBooking,
  completeBooking, cancelBooking, openDispute, getMyBookings, getBookingById,
  providerComplete, clientConfirmCompletion, clientDisputeCompletion, submitEvidence,
  getRecurringBookings,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook/stripe', stripeWebhook);
router.get('/', authenticate, getMyBookings);
router.post('/', authenticate, createBooking);
router.get('/:bookingId', authenticate, getBookingById);
router.get('/:bookingId/recurring', authenticate, getRecurringBookings);
router.post('/:bookingId/pay', authenticate, payBooking);
router.post('/:bookingId/confirm-payment', authenticate, confirmPayment);
router.post('/:bookingId/accept', authenticate, requireRole('PROFESSIONAL'), acceptBooking);
router.post('/:bookingId/start', authenticate, requireRole('PROFESSIONAL'), startBooking);
router.post('/:bookingId/complete', authenticate, completeBooking);
router.post('/:bookingId/provider-complete', authenticate, requireRole('PROFESSIONAL'), providerComplete);
router.post('/:bookingId/client-confirm', authenticate, clientConfirmCompletion);
router.post('/:bookingId/client-dispute', authenticate, clientDisputeCompletion);
router.post('/:bookingId/evidence', authenticate, requireRole('PROFESSIONAL'), submitEvidence);
router.post('/:bookingId/cancel', authenticate, cancelBooking);
router.post('/:bookingId/dispute', authenticate, openDispute);

export default router;
