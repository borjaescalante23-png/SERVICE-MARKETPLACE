import { Router } from 'express'
import { createClass, updateClass, deleteClass } from '../controllers/classes.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createClass)
router.patch('/:id', authenticate, updateClass)
router.delete('/:id', authenticate, deleteClass)

export default router
