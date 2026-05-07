import { Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../middleware/auth'

export async function createClass(req: AuthRequest, res: Response) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    if (!tutor) return res.status(403).json({ error: 'Activate tutor mode first' })

    const { title, description, category, subcategory, pricePerHour, duration, level, teachingMode, language, includes } = req.body
    const cls = await prisma.tutorClass.create({
      data: {
        tutorId: tutor.id, title, description, category,
        subcategory, pricePerHour: parseFloat(pricePerHour),
        duration: duration || 60, level: level || 'ALL',
        teachingMode: teachingMode || 'BOTH', language: language || 'Español',
        includes
      }
    })
    return res.status(201).json(cls)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function updateClass(req: AuthRequest, res: Response) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    if (!tutor) return res.status(403).json({ error: 'Not a tutor' })

    const cls = await prisma.tutorClass.findFirst({ where: { id: req.params.id, tutorId: tutor.id } })
    if (!cls) return res.status(404).json({ error: 'Class not found' })

    const updated = await prisma.tutorClass.update({ where: { id: req.params.id }, data: req.body })
    return res.json(updated)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function deleteClass(req: AuthRequest, res: Response) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    if (!tutor) return res.status(403).json({ error: 'Not a tutor' })

    const cls = await prisma.tutorClass.findFirst({ where: { id: req.params.id, tutorId: tutor.id } })
    if (!cls) return res.status(404).json({ error: 'Class not found' })

    await prisma.tutorClass.update({ where: { id: req.params.id }, data: { isActive: false } })
    return res.json({ success: true })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}
