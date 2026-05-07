import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listTutors(req: Request, res: Response) {
  try {
    const { category, teachingMode, query, minPrice, maxPrice, level } = req.query

    const tutors = await prisma.tutorProfile.findMany({
      where: {
        isVisible: true,
        ...(teachingMode && teachingMode !== 'ALL' ? { teachingMode: { in: [teachingMode as string, 'BOTH'] } } : {}),
        classes: {
          some: {
            isActive: true,
            ...(category ? { category: category as string } : {}),
            ...(level && level !== 'ALL' ? { level: { in: [level as string, 'ALL'] } } : {}),
            ...(minPrice ? { pricePerHour: { gte: parseFloat(minPrice as string) } } : {}),
            ...(maxPrice ? { pricePerHour: { lte: parseFloat(maxPrice as string) } } : {}),
            ...(query ? {
              OR: [
                { title: { contains: query as string } },
                { description: { contains: query as string } },
                { category: { contains: query as string } }
              ]
            } : {})
          }
        }
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        classes: {
          where: {
            isActive: true,
            ...(category ? { category: category as string } : {})
          },
          take: 2
        }
      },
      orderBy: { avgRating: 'desc' }
    })

    return res.json(tutors)
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function getTutorById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, createdAt: true } },
        classes: { where: { isActive: true } },
        availability: true,
        portfolioPhotos: { take: 10 }
      }
    })
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' })

    const reviews = await prisma.review.findMany({
      where: { booking: { tutorId: id } },
      include: { student: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return res.json({ ...tutor, reviews })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function getMyTutorProfile(req: AuthRequest, res: Response) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
      include: { classes: true, availability: true }
    })
    if (!tutor) return res.status(404).json({ error: 'Tutor profile not found' })
    return res.json(tutor)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function updateMyTutorProfile(req: AuthRequest, res: Response) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    if (!tutor) return res.status(404).json({ error: 'Tutor profile not found' })

    const { headline, bio, city, languages, teachingMode, isVisible } = req.body
    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user!.id },
      data: { headline, bio, city, languages, teachingMode, isVisible }
    })
    return res.json(updated)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function activateTutorMode(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    if (existing) return res.json(existing)

    const { headline, bio, city, languages, teachingMode } = req.body
    const tutor = await prisma.tutorProfile.create({
      data: {
        userId: req.user!.id,
        headline: headline || '',
        bio: bio || '',
        city: city || '',
        languages: languages || 'Español',
        teachingMode: teachingMode || 'BOTH'
      }
    })
    return res.status(201).json(tutor)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}
