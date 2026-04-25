import { Router } from 'express';
import { register, login, refresh, logout, me, uploadAvatar, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAvatar as multerAvatar } from '../utils/upload';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/avatar', authenticate, multerAvatar.single('file'), uploadAvatar);
router.patch('/password', authenticate, changePassword);

export default router;
