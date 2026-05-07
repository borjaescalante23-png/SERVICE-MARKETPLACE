import { Router } from 'express'
import { listTutors, getTutorById, getMyTutorProfile, updateMyTutorProfile, activateTutorMode } from '../controllers/tutors.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', listTutors)
router.get('/me', authenticate, getMyTutorProfile)
router.patch('/me', authenticate, updateMyTutorProfile)
router.post('/me/activate', authenticate, activateTutorMode)
router.get('/:id', getTutorById)

export default router
