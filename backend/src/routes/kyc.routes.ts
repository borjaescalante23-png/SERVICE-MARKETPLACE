import { Router } from 'express';
import { getKYCStatus, submitKYCSelfie, getKYCResult } from '../controllers/kyc.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const kycDir = path.join(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });

const storage = multer.diskStorage({
  destination: kycDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `selfie-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

const router = Router();

router.get('/status', authenticate, requireRole('PROFESSIONAL'), getKYCStatus);
router.get('/result', authenticate, requireRole('PROFESSIONAL'), getKYCResult);
router.post('/selfie', authenticate, requireRole('PROFESSIONAL'), upload.single('selfie'), submitKYCSelfie);

export default router;
