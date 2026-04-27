import { Router } from 'express';
import {
  getMyProfile, updateBio, updateProfile, addExperienceEntry, deleteExperienceEntry,
  uploadDocument, deleteDocument, getProfessionals, getProfessionalById,
} from '../controllers/professional.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { uploadDocument as multerDoc, uploadExperience } from '../utils/upload';

const router = Router();

router.get('/', authenticate, getProfessionals);
router.get('/me', authenticate, requireRole('PROFESSIONAL'), getMyProfile);
router.get('/:id', authenticate, getProfessionalById);

router.patch('/me/bio', authenticate, requireRole('PROFESSIONAL'), updateBio);
router.patch('/me/profile', authenticate, requireRole('PROFESSIONAL'), updateProfile);

router.post(
  '/me/experience',
  authenticate,
  requireRole('PROFESSIONAL'),
  uploadExperience.array('images', 5),
  addExperienceEntry
);
router.delete('/me/experience/:entryId', authenticate, requireRole('PROFESSIONAL'), deleteExperienceEntry);

router.post(
  '/me/documents',
  authenticate,
  requireRole('PROFESSIONAL'),
  multerDoc.single('file'),
  uploadDocument
);
router.delete('/me/documents/:docId', authenticate, requireRole('PROFESSIONAL'), deleteDocument);

export default router;
