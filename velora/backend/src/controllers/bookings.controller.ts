import { Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../middleware/auth'

export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const { classId, scheduledAt, teachingMode, address, onlineLink, studentNotes, isRecurring, recurringFrequency } = req.body

    const cls = await prisma.tutorClass.findUnique({ where: { id: classId }, include: { tutor: true } })
    if (!cls) return res.status(404).json({ error: 'Class not found' })

    const platformFee = cls.pricePerHour * 0.1
    const tutorAmount = cls.pricePerHour - platformFee

    const booking = await prisma.booking.create({
      data: {
        studentId: req.user!.id,
        tutorId: cls.tutorId,
        classId,
        scheduledAt: new Date(scheduledAt),
        teachingMode: teachingMode || 'ONLINE',
        address,
        onlineLink,
        studentNotes,
        isRecurring: isRecurring || false,
        recurringFrequency,
        duration: cls.duration,
        totalAmount: cls.pricePerHour,
        platformFee,
        tutorAmount
      },
      include: { class: true, tutor: { include: { user: true } } }
    })
    return res.status(201).json(booking)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function listBookings(req: AuthRequest, res: Response) {
  try {
    const { role } = req.query
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })

    let where: any = {}
    if (role === 'tutor' && tutorProfile) {
      where = { tutorId: tutorProfile.id }
    } else {
      where = { studentId: req.user!.id }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        class: true,
        tutor: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        student: { select: { firstName: true, lastName: true, avatarUrl: true } },
        review: true
      },
      orderBy: { scheduledAt: 'desc' }
    })
    return res.json(bookings)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function getBookingById(req: AuthRequest, res: Response) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        class: true,
        tutor: { include: { user: true } },
        student: true,
        review: true,
        messages: { include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } }
      }
    })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.studentId !== req.user!.id) {
      const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
      if (!tutorProfile || booking.tutorId !== tutorProfile.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
    return res.json(booking)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function updateBookingStatus(req: AuthRequest, res: Response) {
  try {
    const { status } = req.body
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { status } })
    return res.json(updated)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}
