import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import prisma from '../utils/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }
    req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
