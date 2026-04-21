import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/bookings/:bookingId/messages', authenticate, getMessages);
router.post('/bookings/:bookingId/messages', authenticate, sendMessage);

export default router;
