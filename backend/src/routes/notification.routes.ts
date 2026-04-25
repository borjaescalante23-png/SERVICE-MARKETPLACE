import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, getUnreadCount, updateSettings, updateLocation } from '../controllers/notification.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/all/read', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/settings', authenticate, updateSettings);
router.patch('/location', authenticate, requireRole('PROFESSIONAL'), updateLocation);

export default router;
