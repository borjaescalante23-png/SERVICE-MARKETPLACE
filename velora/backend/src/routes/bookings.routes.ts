import { Router } from 'express'
import { createBooking, listBookings, getBookingById, updateBookingStatus } from '../controllers/bookings.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createBooking)
router.get('/', authenticate, listBookings)
router.get('/:id', authenticate, getBookingById)
router.patch('/:id/status', authenticate, updateBookingStatus)

export default router
