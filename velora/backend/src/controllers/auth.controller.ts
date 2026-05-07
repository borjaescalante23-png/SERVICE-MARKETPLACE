import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AuthRequest } from '../middleware/auth'

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password } = req.body
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true }
    })

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })

    return res.status(201).json({ accessToken, refreshToken, user })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })

    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } })

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        role: user.role, avatarUrl: user.avatarUrl, tutorProfile
      }
    })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ error: 'Invalid refresh token' })

    const payload = verifyRefreshToken(refreshToken)
    const accessToken = generateAccessToken(payload.userId)
    return res.json({ accessToken })
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true, createdAt: true }
    })
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } })
    return res.json({ ...user, tutorProfile })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}
