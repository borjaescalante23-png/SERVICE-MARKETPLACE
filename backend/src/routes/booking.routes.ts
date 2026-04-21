import { Router } from 'express';
import {
  createBooking, payBooking, acceptBooking, startBooking,
  completeBooking, cancelBooking, openDispute, getMyBookings, getBookingById,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyBookings);
router.post('/', authenticate, requireRole('CLIENT'), createBooking);
router.get('/:bookingId', authenticate, getBookingById);
router.post('/:bookingId/pay', authenticate, requireRole('CLIENT'), payBooking);
router.post('/:bookingId/accept', authenticate, requireRole('PROFESSIONAL'), acceptBooking);
router.post('/:bookingId/start', authenticate, requireRole('PROFESSIONAL'), startBooking);
router.post('/:bookingId/complete', authenticate, completeBooking);
router.post('/:bookingId/cancel', authenticate, cancelBooking);
router.post('/:bookingId/dispute', authenticate, openDispute);

export default router;
