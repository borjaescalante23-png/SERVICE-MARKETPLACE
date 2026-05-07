#!/usr/bin/env python3
"""Run this from the root of SERVICE-MARKETPLACE repo to create all Velora files."""
import os

def w(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  created {path}")

print("Creating Velora files...")

# ── BACKEND ────────────────────────────────────────────────────────────────────

w("velora/backend/.env", '''DATABASE_URL="file:./dev.db"
JWT_SECRET="velora-secret-key-2026"
JWT_REFRESH_SECRET="velora-refresh-secret-2026"
PORT=3001
NODE_ENV=development
''')

w("velora/backend/.gitignore", '''node_modules/
dist/
prisma/dev.db
prisma/dev.db-journal
.env
''')

w("velora/backend/package.json", '''{
  "name": "velora-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.10.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.0",
    "@types/uuid": "^9.0.7",
    "prisma": "^5.10.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
''')

w("velora/backend/tsconfig.json", '''{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
''')

w("velora/backend/prisma/schema.prisma", '''generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  avatarUrl     String?
  role          String    @default("USER")
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  refreshTokens RefreshToken[]
  tutorProfile  TutorProfile?
  bookingsAsStudent Booking[] @relation("StudentBookings")
  reviews       Review[]  @relation("StudentReviews")
  favorites     Favorite[]
  notifications Notification[]
  sentMessages  Message[] @relation("SentMessages")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model TutorProfile {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline          String?
  bio               String?
  avgRating         Float     @default(0)
  totalReviews      Int       @default(0)
  completedSessions Int       @default(0)
  isVerified        Boolean   @default(false)
  isVisible         Boolean   @default(true)
  city              String?
  languages         String    @default("Español")
  teachingMode      String    @default("BOTH")
  stripeConnectId   String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  classes           TutorClass[]
  bookings          Booking[] @relation("TutorBookings")
  availability      TutorAvailability[]
  portfolioPhotos   PortfolioPhoto[]
}

model TutorClass {
  id            String        @id @default(uuid())
  tutorId       String
  tutor         TutorProfile  @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  title         String
  description   String
  category      String
  subcategory   String?
  pricePerHour  Float
  duration      Int           @default(60)
  level         String        @default("ALL")
  teachingMode  String        @default("BOTH")
  language      String        @default("Español")
  includes      String?
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  bookings      Booking[]
  portfolioPhotos PortfolioPhoto[]
}

model TutorAvailability {
  id            String        @id @default(uuid())
  tutorId       String
  tutor         TutorProfile  @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  dayOfWeek     Int
  startTime     String
  endTime       String
  isAvailable   Boolean       @default(true)
  @@unique([tutorId, dayOfWeek])
}

model Booking {
  id                  String        @id @default(uuid())
  studentId           String
  student             User          @relation("StudentBookings", fields: [studentId], references: [id])
  tutorId             String
  tutor               TutorProfile  @relation("TutorBookings", fields: [tutorId], references: [id])
  classId             String
  class               TutorClass    @relation(fields: [classId], references: [id])
  status              String        @default("PENDING")
  paymentStatus       String        @default("PENDING")
  teachingMode        String        @default("PRESENTIAL")
  address             String?
  onlineLink          String?
  scheduledAt         DateTime
  duration            Int           @default(60)
  totalAmount         Float
  platformFee         Float
  tutorAmount         Float
  isRecurring         Boolean       @default(false)
  recurringFrequency  String?
  parentBookingId     String?
  studentNotes        String?
  cancelledAt         DateTime?
  cancelledBy         String?
  cancellationReason  String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  review              Review?
  messages            Message[]
}

model Review {
  id          String      @id @default(uuid())
  bookingId   String      @unique
  booking     Booking     @relation(fields: [bookingId], references: [id])
  studentId   String
  student     User        @relation("StudentReviews", fields: [studentId], references: [id])
  rating      Int
  comment     String
  createdAt   DateTime    @default(now())
}

model Message {
  id          String    @id @default(uuid())
  bookingId   String
  booking     Booking   @relation(fields: [bookingId], references: [id])
  senderId    String
  sender      User      @relation("SentMessages", fields: [senderId], references: [id])
  content     String
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tutorId   String
  createdAt DateTime @default(now())
  @@unique([userId, tutorId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  body      String
  type      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model StudentRequest {
  id                String    @id @default(uuid())
  studentId         String
  title             String
  description       String
  category          String
  subcategory       String?
  teachingMode      String    @default("BOTH")
  level             String?
  isRecurring       Boolean   @default(false)
  recurringFrequency String?
  preferredDate     DateTime?
  maxBudget         Float?
  status            String    @default("OPEN")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  proposals         TutorProposal[]
}

model TutorProposal {
  id            String          @id @default(uuid())
  requestId     String
  request       StudentRequest  @relation(fields: [requestId], references: [id])
  tutorId       String
  pricePerHour  Float
  message       String
  proposedDate  DateTime?
  status        String          @default("PENDING")
  createdAt     DateTime        @default(now())
}

model PortfolioPhoto {
  id        String        @id @default(uuid())
  tutorId   String
  tutor     TutorProfile  @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  classId   String?
  class     TutorClass?   @relation(fields: [classId], references: [id])
  fileUrl   String
  caption   String?
  createdAt DateTime      @default(now())
}
''')

w("velora/backend/prisma/seed.ts", r'''import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Velora database...')

  const tutorData = [
    {
      firstName: 'Laura', lastName: 'García', email: 'laura@velora.com',
      headline: 'Inglés conversacional para todos los niveles',
      bio: 'Profesora nativa con 8 años de experiencia. Metodología comunicativa, aprenderás a hablar desde la primera clase.',
      city: 'Madrid', languages: 'Español, Inglés', teachingMode: 'BOTH',
      avgRating: 4.8, totalReviews: 32, completedSessions: 128, isVerified: true,
      classes: [
        { title: 'Inglés conversacional', description: 'Aprende a hablar inglés con fluidez en situaciones cotidianas.', category: 'IDIOMAS', pricePerHour: 20, level: 'ALL', teachingMode: 'BOTH', includes: 'Material didáctico,Grabaciones de clase,Ejercicios personalizados,Seguimiento progreso' },
        { title: 'Inglés para negocios', description: 'Domina el inglés profesional para reuniones, emails y presentaciones.', category: 'IDIOMAS', pricePerHour: 25, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Material profesional,Simulacros de reunión,Vocabulario técnico' }
      ]
    },
    {
      firstName: 'Carlos', lastName: 'Martínez', email: 'carlos@velora.com',
      headline: 'Entrenador personal de tenis · 10 años de experiencia',
      bio: 'Ex jugador profesional. Entreno a jugadores de todos los niveles. Tengo pista propia en Barcelona.',
      city: 'Barcelona', languages: 'Español, Catalán', teachingMode: 'PRESENTIAL',
      avgRating: 4.9, totalReviews: 18, completedSessions: 94, isVerified: true,
      classes: [
        { title: 'Tenis para principiantes', description: 'Aprende los fundamentos del tenis: técnica, golpes básicos y juego táctico. Pista incluida.', category: 'DEPORTES', pricePerHour: 25, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Pista de tenis,Pelotas incluidas,Análisis de técnica en vídeo' },
        { title: 'Tenis de competición', description: 'Perfecciona tu juego para torneos. Táctica avanzada, saque y subida a la red.', category: 'DEPORTES', pricePerHour: 35, level: 'ADVANCED', teachingMode: 'PRESENTIAL', includes: 'Análisis táctico,Vídeo análisis,Plan de entrenamiento' }
      ]
    },
    {
      firstName: 'David', lastName: 'Rodríguez', email: 'david@velora.com',
      headline: 'Python · Machine Learning · Desde cero hasta profesional',
      bio: 'Ingeniero de software senior con 12 años en la industria. He ayudado a más de 200 estudiantes.',
      city: 'Online', languages: 'Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 5.0, totalReviews: 21, completedSessions: 87, isVerified: true,
      classes: [
        { title: 'Python para principiantes', description: 'Aprende Python desde cero. Variables, funciones, listas, diccionarios y proyectos reales.', category: 'TECNOLOGIA', pricePerHour: 22, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Código fuente,Proyectos prácticos,Soporte por WhatsApp,Certificado' },
        { title: 'Machine Learning con Python', description: 'Introducción al ML: regresión, clasificación, redes neuronales. Casos reales.', category: 'TECNOLOGIA', pricePerHour: 30, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Notebooks Jupyter,Datasets reales,Proyectos en GitHub' }
      ]
    },
    {
      firstName: 'Ana', lastName: 'Ruiz', email: 'ana@velora.com',
      headline: 'Profesora de piano · Conservatorio Superior de Música',
      bio: 'Pianista clásica titulada por el Real Conservatorio. Doy clases desde nivel iniciación hasta conservatorio.',
      city: 'Sevilla', languages: 'Español', teachingMode: 'PRESENTIAL',
      avgRating: 4.7, totalReviews: 15, completedSessions: 63, isVerified: true,
      classes: [
        { title: 'Piano · Iniciación', description: 'Aprende a tocar el piano desde cero. Lectura de notas, técnica básica y primeras piezas.', category: 'MUSICA', pricePerHour: 30, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Partituras incluidas,Grabaciones de referencia,Plan de estudio personalizado' },
        { title: 'Piano · Preparación conservatorio', description: 'Preparación específica para las pruebas de acceso al conservatorio.', category: 'MUSICA', pricePerHour: 40, level: 'ADVANCED', teachingMode: 'PRESENTIAL', includes: 'Partituras,Simulacros de prueba,Feedback detallado' }
      ]
    },
    {
      firstName: 'Marc', lastName: 'Soler', email: 'marc@velora.com',
      headline: 'Matemáticas, Física y Química · Selectividad y bachillerato',
      bio: 'Ingeniero Industrial con máster en matemáticas aplicadas. Tasa de aprobados del 96% en selectividad.',
      city: 'Barcelona', languages: 'Español, Catalán, Inglés', teachingMode: 'BOTH',
      avgRating: 4.9, totalReviews: 28, completedSessions: 112, isVerified: true,
      classes: [
        { title: 'Matemáticas bachillerato', description: 'Repaso completo de matemáticas de bachillerato. Álgebra, cálculo, estadística.', category: 'ACADEMIA', pricePerHour: 18, level: 'INTERMEDIATE', teachingMode: 'BOTH', includes: 'Apuntes resumidos,Ejercicios resueltos,Simulacros de examen,WhatsApp para dudas' },
        { title: 'Preparación selectividad', description: 'Preparación intensiva para EBAU/EVAU. Todos los temas + exámenes anteriores.', category: 'ACADEMIA', pricePerHour: 22, level: 'ADVANCED', teachingMode: 'BOTH', includes: 'Pack exámenes anteriores,Sesiones de revisión,Plan de estudio' }
      ]
    },
    {
      firstName: 'Julia', lastName: 'Ramírez', email: 'julia@velora.com',
      headline: 'Entrenadora personal · Fitness funcional y pérdida de peso',
      bio: 'Graduada en Ciencias del Deporte. Especialista en entrenamiento funcional y nutrición deportiva.',
      city: 'Madrid', languages: 'Español', teachingMode: 'PRESENTIAL',
      avgRating: 5.0, totalReviews: 20, completedSessions: 98, isVerified: true,
      classes: [
        { title: 'Entrenamiento funcional', description: 'Entrena de forma eficiente con tu propio peso corporal. Sin equipamiento necesario.', category: 'DEPORTES', pricePerHour: 25, level: 'ALL', teachingMode: 'PRESENTIAL', includes: 'Plan de entrenamiento,Seguimiento semanal,Nutrición básica,WhatsApp directo' },
        { title: 'Pérdida de peso sostenible', description: 'Programa completo de 12 semanas para transformar tu cuerpo de forma saludable.', category: 'DEPORTES', pricePerHour: 30, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Plan nutricional,Entrenamiento personalizado,Control de progreso' }
      ]
    },
    {
      firstName: 'Sofia', lastName: 'Pérez', email: 'sofia@velora.com',
      headline: 'Francés A1 al B2 · Profesora nativa de París',
      bio: 'Nativa de París, vivo en España desde hace 5 años. Preparo para DELF y DALF.',
      city: 'Online', languages: 'Francés, Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 4.8, totalReviews: 24, completedSessions: 96, isVerified: true,
      classes: [
        { title: 'Francés desde cero (A1-A2)', description: 'Empieza a hablar francés desde el primer día. Pronunciación, gramática y conversación.', category: 'IDIOMAS', pricePerHour: 22, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Material de gramática,Audios de pronunciación,Ejercicios interactivos' },
        { title: 'Preparación DELF B1-B2', description: 'Prepárate para el examen oficial DELF con ejercicios específicos de cada parte.', category: 'IDIOMAS', pricePerHour: 28, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Simulacros de examen,Corrección detallada,Material oficial DELF' }
      ]
    },
    {
      firstName: 'Pablo', lastName: 'Torres', email: 'pablo@velora.com',
      headline: 'Diseño gráfico · Adobe Suite · Marca personal',
      bio: 'Diseñador con 10 años en agencias internacionales. Enseño a crear diseños profesionales.',
      city: 'Online', languages: 'Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 4.6, totalReviews: 12, completedSessions: 48, isVerified: false,
      classes: [
        { title: 'Diseño gráfico desde cero', description: 'Aprende los fundamentos del diseño: tipografía, color, composición y Adobe Illustrator.', category: 'ARTE', pricePerHour: 28, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Archivos fuente,Recursos premium,Feedback personalizado' },
        { title: 'Diseño de marca personal', description: 'Crea tu identidad de marca desde cero: logotipo, paleta de color, tipografía y guía de estilo.', category: 'ARTE', pricePerHour: 35, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Kit de marca completo,Revisiones ilimitadas,Entrega de archivos finales' }
      ]
    }
  ]

  for (const data of tutorData) {
    const { classes, avgRating, totalReviews, completedSessions, isVerified, headline, bio, city, languages, teachingMode, ...userData } = data
    const hashed = await bcrypt.hash('Tutor1234!', 10)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, password: hashed }
    })

    const tutor = await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, headline, bio, city, languages, teachingMode, avgRating, totalReviews, completedSessions, isVerified }
    })

    for (const cls of classes) {
      const existing = await prisma.tutorClass.findFirst({ where: { tutorId: tutor.id, title: cls.title } })
      if (!existing) {
        await prisma.tutorClass.create({ data: { tutorId: tutor.id, ...cls } })
      }
    }

    for (let day = 1; day <= 5; day++) {
      await prisma.tutorAvailability.upsert({
        where: { tutorId_dayOfWeek: { tutorId: tutor.id, dayOfWeek: day } },
        update: {},
        create: { tutorId: tutor.id, dayOfWeek: day, startTime: '09:00', endTime: '20:00' }
      })
    }
  }

  const studentHash = await bcrypt.hash('Test1234!', 10)
  await prisma.user.upsert({
    where: { email: 'alumno@test.com' },
    update: {},
    create: { email: 'alumno@test.com', password: studentHash, firstName: 'Alumno', lastName: 'Test' }
  })

  const adminHash = await bcrypt.hash('Admin1234!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@velora.com' },
    update: {},
    create: { email: 'admin@velora.com', password: adminHash, firstName: 'Admin', lastName: 'Velora', role: 'ADMIN' }
  })

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
''')

w("velora/backend/src/app.ts", '''import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import tutorsRoutes from './routes/tutors.routes'
import classesRoutes from './routes/classes.routes'
import bookingsRoutes from './routes/bookings.routes'

const app = express()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/tutors', tutorsRoutes)
app.use('/api/classes', classesRoutes)
app.use('/api/bookings', bookingsRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', project: 'velora' }))

export default app
''')

w("velora/backend/src/server.ts", '''import app from './app'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Velora backend running on http://localhost:${PORT}`)
})
''')

w("velora/backend/src/utils/jwt.ts", '''import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'velora-secret-key-2026'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'velora-refresh-secret-2026'

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string }
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
}
''')

w("velora/backend/src/utils/prisma.ts", '''import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
''')

w("velora/backend/src/middleware/auth.ts", '''import { Request, Response, NextFunction } from 'express'
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
''')

w("velora/backend/src/controllers/auth.controller.ts", '''import { Request, Response } from 'express'
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
''')

w("velora/backend/src/controllers/tutors.controller.ts", '''import { Request, Response } from 'express'
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
          where: { isActive: true, ...(category ? { category: category as string } : {}) },
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
''')

w("velora/backend/src/controllers/classes.controller.ts", '''import { Response } from 'express'
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
''')

w("velora/backend/src/controllers/bookings.controller.ts", '''import { Response } from 'express'
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
''')

w("velora/backend/src/routes/auth.routes.ts", '''import { Router } from 'express'
import { register, login, refresh, me } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)

export default router
''')

w("velora/backend/src/routes/tutors.routes.ts", '''import { Router } from 'express'
import { listTutors, getTutorById, getMyTutorProfile, updateMyTutorProfile, activateTutorMode } from '../controllers/tutors.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', listTutors)
router.get('/me', authenticate, getMyTutorProfile)
router.patch('/me', authenticate, updateMyTutorProfile)
router.post('/me/activate', authenticate, activateTutorMode)
router.get('/:id', getTutorById)

export default router
''')

w("velora/backend/src/routes/classes.routes.ts", '''import { Router } from 'express'
import { createClass, updateClass, deleteClass } from '../controllers/classes.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createClass)
router.patch('/:id', authenticate, updateClass)
router.delete('/:id', authenticate, deleteClass)

export default router
''')

w("velora/backend/src/routes/bookings.routes.ts", '''import { Router } from 'express'
import { createBooking, listBookings, getBookingById, updateBookingStatus } from '../controllers/bookings.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, createBooking)
router.get('/', authenticate, listBookings)
router.get('/:id', authenticate, getBookingById)
router.patch('/:id/status', authenticate, updateBookingStatus)

export default router
''')

# ── FRONTEND ───────────────────────────────────────────────────────────────────

w("velora/frontend/.gitignore", '''node_modules/
dist/
.env
''')

w("velora/frontend/package.json", '''{
  "name": "velora-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "lucide-react": "^0.312.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
''')

w("velora/frontend/vite.config.ts", '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
''')

w("velora/frontend/tailwind.config.js", '''/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F1F5C',
        accent: '#3B6FE8',
        'bg-card': '#F2F4F8',
        'text-secondary': '#6B7A99',
        'green-available': '#16A34A',
        'gold-rating': '#D97706',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
''')

w("velora/frontend/postcss.config.js", '''export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
''')

w("velora/frontend/tsconfig.json", '''{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
''')

w("velora/frontend/tsconfig.node.json", '''{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
''')

w("velora/frontend/index.html", '''<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Velora — Aprende. Enseña. Conecta.</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
''')

w("velora/frontend/src/main.tsx", '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
''')

w("velora/frontend/src/index.css", '''@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
  color: #0F1F5C;
  -webkit-font-smoothing: antialiased;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
}

#root {
  min-height: 100vh;
}

input, textarea, select {
  font-size: 16px !important;
}

::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
''')

w("velora/frontend/src/App.tsx", '''import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Explore from './pages/Explore'
import TutorProfile from './pages/TutorProfile'
import Booking from './pages/Booking'
import PublishClass from './pages/PublishClass'
import Messages from './pages/Messages'
import Profile from './pages/Profile'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return <Navigate to={isAuthenticated ? \'/home\' : \'/login\'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:category" element={<Explore />} />
            <Route path="/tutor/:id" element={<TutorProfile />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/booking/:classId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/publish" element={<ProtectedRoute><PublishClass /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
''')

w("velora/frontend/src/types/index.ts", '''export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  role: string
  tutorProfile?: TutorProfile
  createdAt?: string
}

export interface TutorProfile {
  id: string
  userId: string
  headline?: string
  bio?: string
  avgRating: number
  totalReviews: number
  completedSessions: number
  isVerified: boolean
  isVisible: boolean
  city?: string
  languages: string
  teachingMode: string
  createdAt: string
  updatedAt: string
  user?: User
  classes?: TutorClass[]
  availability?: TutorAvailability[]
  reviews?: Review[]
}

export interface TutorClass {
  id: string
  tutorId: string
  title: string
  description: string
  category: string
  subcategory?: string
  pricePerHour: number
  duration: number
  level: string
  teachingMode: string
  language: string
  includes?: string
  isActive: boolean
  createdAt: string
  tutor?: TutorProfile
}

export interface TutorAvailability {
  id: string
  tutorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Booking {
  id: string
  studentId: string
  tutorId: string
  classId: string
  status: string
  paymentStatus: string
  teachingMode: string
  address?: string
  onlineLink?: string
  scheduledAt: string
  duration: number
  totalAmount: number
  platformFee: number
  tutorAmount: number
  isRecurring: boolean
  recurringFrequency?: string
  studentNotes?: string
  createdAt: string
  class?: TutorClass
  tutor?: TutorProfile
  student?: User
  review?: Review
}

export interface Review {
  id: string
  bookingId: string
  studentId: string
  rating: number
  comment: string
  createdAt: string
  student?: User
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Category {
  id: string
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
}
''')

w("velora/frontend/src/config/categories.ts", '''export const TUTOR_CATEGORIES = [
  { id: 'TECNOLOGIA', label: 'Tecnología', description: 'Programación, IA, Diseño web y más', icon: 'Monitor', color: '#3B6FE8', bgColor: '#EEF2FF' },
  { id: 'IDIOMAS', label: 'Idiomas', description: 'Inglés, Francés, Alemán y más', icon: 'Globe', color: '#0891B2', bgColor: '#ECFEFF' },
  { id: 'DESARROLLO_PERSONAL', label: 'Desarrollo personal', description: 'Coaching, Mindset, Productividad y más', icon: 'Star', color: '#D97706', bgColor: '#FFFBEB' },
  { id: 'DEPORTES', label: 'Deportes', description: 'Tenis, Yoga, Fitness, Natación y más', icon: 'Dumbbell', color: '#16A34A', bgColor: '#F0FDF4' },
  { id: 'MUSICA', label: 'Música', description: 'Piano, Guitarra, Canto y más', icon: 'Music', color: '#EA580C', bgColor: '#FFF7ED' },
  { id: 'ARTE', label: 'Arte y diseño', description: 'Dibujo, Fotografía, Diseño gráfico y más', icon: 'Palette', color: '#E11D48', bgColor: '#FFF1F2' },
  { id: 'ACADEMIA', label: 'Academia', description: 'Matemáticas, Física, Química y más', icon: 'BookOpen', color: '#7C3AED', bgColor: '#F5F3FF' },
  { id: 'NEGOCIOS', label: 'Negocios y finanzas', description: 'Emprendimiento, Marketing, Finanzas y más', icon: 'Briefcase', color: '#0F766E', bgColor: '#F0FDFA' },
  { id: 'ESTILO_VIDA', label: 'Estilo de vida', description: 'Cocina, Viajes, Bienestar y más', icon: 'Heart', color: '#DB2777', bgColor: '#FDF2F8' },
]
''')

w("velora/frontend/src/services/api.ts", '''import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('velora_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('velora_token')
      localStorage.removeItem('velora_refresh_token')
      localStorage.removeItem('velora_user')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
}

export const tutorsApi = {
  list: (params?: Record<string, string>) => api.get('/tutors', { params }),
  getById: (id: string) => api.get(`/tutors/${id}`),
  getMe: () => api.get('/tutors/me'),
  update: (data: any) => api.patch('/tutors/me', data),
  activate: (data: any) => api.post('/tutors/me/activate', data),
}

export const classesApi = {
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.patch(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
}

export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  list: (params?: Record<string, string>) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
}

export const favoritesApi = {
  add: (tutorId: string) => api.post('/favorites', { tutorId }),
  remove: (tutorId: string) => api.delete(`/favorites/${tutorId}`),
  list: () => api.get('/favorites'),
}

export default api
''')

w("velora/frontend/src/contexts/AuthContext.tsx", '''import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import { authApi } from '../services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('velora_token')
    const savedUser = localStorage.getItem('velora_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('velora_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem('velora_token', accessToken)
    localStorage.setItem('velora_refresh_token', refreshToken)
    localStorage.setItem('velora_user', JSON.stringify(user))
    setUser(user)
  }

  const register = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    const res = await authApi.register(data)
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem('velora_token', accessToken)
    localStorage.setItem('velora_refresh_token', refreshToken)
    localStorage.setItem('velora_user', JSON.stringify(user))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('velora_token')
    localStorage.removeItem('velora_refresh_token')
    localStorage.removeItem('velora_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
''')

w("velora/frontend/src/components/BottomNav.tsx", '''import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { icon: Home, label: 'Inicio', path: '/home' },
  { icon: Search, label: 'Explorar', path: '/explore' },
  { icon: Plus, label: 'Publicar', path: '/publish', isCenter: true },
  { icon: MessageCircle, label: 'Mensajes', path: '/messages' },
  { icon: User, label: 'Perfil', path: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex items-end justify-around px-2 pb-safe z-50"
      style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center mb-2"
              style={{ minWidth: 56 }}
            >
              <div className="w-14 h-14 rounded-full bg-[#0F1F5C] flex items-center justify-center shadow-lg"
                style={{ marginBottom: -8 }}>
                <Icon size={24} color="white" strokeWidth={2.5} />
              </div>
            </button>
          )
        }

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-end gap-0.5 pb-1 flex-1"
            style={{ minHeight: 56 }}
          >
            <Icon size={22} color={isActive ? \'#0F1F5C\' : \'#6B7A99\'} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium" style={{ color: isActive ? \'#0F1F5C\' : \'#6B7A99\' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
''')

w("velora/frontend/src/components/CategoryIcon.tsx", '''import {
  Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart
}

interface CategoryIconProps {
  icon: string
  color: string
  bgColor: string
  size?: number
  containerSize?: number
}

export default function CategoryIcon({ icon, color, bgColor, size = 20, containerSize = 40 }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] || BookOpen
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: containerSize, height: containerSize, backgroundColor: bgColor }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </div>
  )
}
''')

w("velora/frontend/src/components/TutorCard.tsx", '''import { Star, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TutorProfile } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {}
TUTOR_CATEGORIES.forEach(c => { CATEGORY_COLORS[c.id] = { bg: c.bgColor, color: c.color } })

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

interface TutorCardProps {
  tutor: TutorProfile
  compact?: boolean
}

export default function TutorCard({ tutor, compact = false }: TutorCardProps) {
  const navigate = useNavigate()
  const mainClass = tutor.classes?.[0]
  const category = mainClass?.category || 'ACADEMIA'
  const colors = CATEGORY_COLORS[category] || { bg: '#F5F3FF', color: '#7C3AED' }

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/tutor/${tutor.id}`)}
        className="flex items-center gap-3 w-full p-3 bg-white rounded-2xl shadow-sm border border-gray-50 text-left"
      >
        <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: colors.color }}>
          {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F1F5C] truncate">
            {tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}
          </p>
          <p className="text-xs text-[#6B7A99] truncate">{mainClass?.title || tutor.headline}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#D97706" color="#D97706" />
            <span className="text-xs font-medium text-[#0F1F5C]">{tutor.avgRating.toFixed(1)}</span>
            <span className="text-xs text-[#6B7A99]">({tutor.totalReviews})</span>
            {mainClass && <span className="text-xs font-bold text-[#0F1F5C] ml-1">{mainClass.pricePerHour}€/h</span>}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate(`/tutor/${tutor.id}`)}
      className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden text-left"
    >
      <div className="relative p-3 pb-0">
        <div className="w-full h-28 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: colors.color }}>
          {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
        </div>
        <button className="absolute top-4 right-4 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center">
          <Heart size={13} color="#6B7A99" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-[#0F1F5C] line-clamp-2 leading-tight">{mainClass?.title || tutor.headline}</p>
        <p className="text-[10px] text-[#6B7A99] mt-0.5 truncate">
          {tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} fill="#D97706" color="#D97706" />
          <span className="text-[10px] font-medium text-[#0F1F5C]">{tutor.avgRating.toFixed(1)}</span>
          <span className="text-[10px] text-[#6B7A99]">({tutor.totalReviews})</span>
        </div>
        {mainClass && (
          <p className="text-sm font-bold text-[#0F1F5C] mt-1">{mainClass.pricePerHour} € / h</p>
        )}
      </div>
    </button>
  )
}
''')

w("velora/frontend/src/pages/Login.tsx", '''import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/home')
    } catch {
      setError('Credenciales incorrectas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 rounded-bl-full opacity-60" style={{ backgroundColor: '#F5EDD6' }} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-2">
            <span className="text-6xl font-black text-[#0F1F5C] leading-none">V</span>
            <span className="absolute -top-1 -right-4 text-[#D97706] text-lg">&#9733;</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
        </div>
        <div className="text-center mb-2">
          <p className="text-xl font-bold text-[#0F1F5C]">
            Aprende. Enseña. <span className="text-[#3B6FE8]">Conecta sin límites.</span>
          </p>
        </div>
        <p className="text-sm text-[#6B7A99] text-center mb-8 leading-relaxed">
          El marketplace de tutoría donde aprender y enseñar es más rápido y fácil.
        </p>
        <div className="flex gap-2 mb-10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F1F5C]" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        </div>
        <form onSubmit={handleLogin} className="w-full space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-full text-base disabled:opacity-70">
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
        <button onClick={() => navigate('/register')}
          className="w-full py-4 bg-white border border-gray-200 text-[#0F1F5C] font-semibold rounded-full text-base mt-3">
          Crear cuenta
        </button>
        <button onClick={() => navigate('/explore')} className="mt-6 text-sm text-[#6B7A99] underline underline-offset-2">
          Explora sin cuenta &rarr;
        </button>
      </div>
    </div>
  )
}
''')

w("velora/frontend/src/pages/Register.tsx", '''import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/home')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 rounded-bl-full opacity-60" style={{ backgroundColor: '#F5EDD6' }} />
      <div className="relative px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ChevronLeft size={24} color="#0F1F5C" /></button>
      </div>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-2">
            <span className="text-5xl font-black text-[#0F1F5C] leading-none">V</span>
            <span className="absolute -top-1 -right-3 text-[#D97706] text-base">&#9733;</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
          <p className="text-[#6B7A99] text-sm mt-1">Crea tu cuenta gratuita</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input name="firstName" placeholder="Nombre" value={form.firstName} onChange={handleChange}
              className="flex-1 px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
            <input name="lastName" placeholder="Apellido" value={form.lastName} onChange={handleChange}
              className="flex-1 px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
          </div>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
          <input name="password" type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={form.password} onChange={handleChange}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" required />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-full text-base mt-2 disabled:opacity-70">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-[#6B7A99] mt-6">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-[#3B6FE8] font-medium">Inicia sesión</button>
        </p>
      </div>
    </div>
  )
}
''')

w("velora/frontend/src/pages/Home.tsx", '''import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, User, Search, CalendarDays, BookMarked, MessageCircle, Heart, Monitor, Globe, Star, Dumbbell, Music, Palette, Briefcase, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import TutorCard from '../components/TutorCard'
import { tutorsApi } from '../services/api'
import { TutorProfile } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'

const ICON_MAP: Record<string, any> = { Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart }
const quickAccess = [
  { icon: CalendarDays, label: 'Mis clases', path: '/bookings' },
  { icon: BookMarked, label: 'Mis reservas', path: '/bookings' },
  { icon: MessageCircle, label: 'Mensajes', path: '/messages' },
  { icon: Heart, label: 'Favoritos', path: '/favorites' },
]
const homeCats = TUTOR_CATEGORIES.slice(0, 5)

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { tutorsApi.list().then(res => setTutors(res.data)).catch(() => {}) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/explore?query=${encodeURIComponent(searchQuery)}`)
  }

  const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="flex items-center justify-between px-4 pt-14 pb-4 bg-white">
        <h1 className="text-2xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
        <button className="relative p-2">
          <Bell size={22} color="#0F1F5C" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </header>
      <main className="px-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F5C]">Hola, {user?.firstName}</h2>
          <p className="text-sm text-[#6B7A99] mt-0.5">¿Qué quieres hacer hoy?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/explore')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0F1F5C] text-white rounded-xl font-semibold text-sm">
            <BookOpen size={17} />Quiero aprender
          </button>
          <button onClick={() => navigate('/publish')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#0F1F5C] text-[#0F1F5C] rounded-xl font-semibold text-sm">
            <User size={17} />Quiero enseñar
          </button>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar clases, materias o habilidades"
            className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5">
            <Search size={19} color="#6B7A99" />
          </button>
        </form>
        <div className="flex justify-around">
          {quickAccess.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1.5" style={{ minWidth: 44 }}>
                <div className="w-12 h-12 bg-[#F2F4F8] rounded-xl flex items-center justify-center"><Icon size={22} color="#0F1F5C" /></div>
                <span className="text-xs text-[#6B7A99]">{item.label}</span>
              </button>
            )
          })}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Categorías</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">Ver todas</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {homeCats.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || BookOpen
              return (
                <button key={cat.id} onClick={() => navigate(`/explore?category=${cat.id}`)} className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: cat.bgColor }}>
                    <Icon size={22} color={cat.color} />
                  </div>
                  <span className="text-[10px] text-[#6B7A99] text-center leading-tight font-medium">{cat.label.split(' ')[0]}</span>
                </button>
              )
            })}
            <button onClick={() => navigate('/explore')} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-2xl bg-[#F2F4F8] flex items-center justify-center"><Plus size={22} color="#6B7A99" /></div>
              <span className="text-[10px] text-[#6B7A99] text-center leading-tight font-medium">Más</span>
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Populares para ti</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">Ver todas</button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {tutors.slice(0, 6).map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Nuevos tutores esta semana</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">Ver todas</button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {tutors.slice(0, 8).map((tutor, i) => {
              const colors = ['#3B6FE8','#0891B2','#D97706','#16A34A','#EA580C','#E11D48','#7C3AED','#DB2777']
              return (
                <button key={tutor.id} onClick={() => navigate(`/tutor/${tutor.id}`)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[i % colors.length] }}>
                    {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
                  </div>
                  <span className="text-[10px] text-[#6B7A99] max-w-[48px] text-center truncate">{tutor.user?.firstName}</span>
                </button>
              )
            })}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
''')

w("velora/frontend/src/pages/Explore.tsx", '''import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import TutorCard from '../components/TutorCard'
import CategoryIcon from '../components/CategoryIcon'
import { TUTOR_CATEGORIES } from '../config/categories'
import { tutorsApi } from '../services/api'
import { TutorProfile } from '../types'
import { useAuth } from '../contexts/AuthContext'

export default function Explore() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''
  const queryParam = searchParams.get('query') || ''
  const [view, setView] = useState<'categories' | 'tutors'>(selectedCategory ? 'tutors' : 'categories')
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [loading, setLoading] = useState(false)

  const loadTutors = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (selectedCategory) params.category = selectedCategory
      if (queryParam) params.query = queryParam
      const res = await tutorsApi.list(params)
      setTutors(res.data)
    } catch { setTutors([]) } finally { setLoading(false) }
  }

  useEffect(() => { if (selectedCategory || queryParam) { setView('tutors'); loadTutors() } }, [selectedCategory, queryParam])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => { prev.set('query', searchQuery); return prev })
    setView('tutors')
  }

  const activeCatLabel = TUTOR_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Tutores'

  if (view === 'tutors') return (
    <div className="min-h-screen bg-white pb-20">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white">
        <button onClick={() => { setView('categories'); setSearchParams({}) }} className="p-2 -ml-2"><ChevronLeft size={24} color="#0F1F5C" /></button>
        <h1 className="text-lg font-bold text-[#0F1F5C] flex-1">{activeCatLabel}</h1>
      </header>
      <div className="px-4 mb-4">
        <form onSubmit={handleSearch} className="relative">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar tutores..."
            className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5"><Search size={18} color="#6B7A99" /></button>
        </form>
      </div>
      <div className="px-4 space-y-3">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" /></div>
        : tutors.length === 0 ? <div className="text-center py-12"><p className="text-[#6B7A99] text-sm">No se encontraron tutores</p></div>
        : tutors.map(tutor => <TutorCard key={tutor.id} tutor={tutor} compact />)}
      </div>
      {isAuthenticated && <BottomNav />}
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ChevronLeft size={24} color="#0F1F5C" /></button>
        <h1 className="text-lg font-bold text-[#0F1F5C] flex-1 text-center">Todas las categorías</h1>
        <div className="w-10" />
      </header>
      <div className="px-4 mb-4">
        <form onSubmit={handleSearch} className="relative">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar categoría"
            className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5"><Search size={18} color="#6B7A99" /></button>
        </form>
      </div>
      <div className="px-4">
        <div className="divide-y divide-gray-50">
          {TUTOR_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => { setSearchParams({ category: cat.id }); setView('tutors') }} className="flex items-center gap-4 py-3.5 w-full text-left">
              <CategoryIcon icon={cat.icon} color={cat.color} bgColor={cat.bgColor} size={20} containerSize={44} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0F1F5C]">{cat.label}</p>
                <p className="text-xs text-[#6B7A99] mt-0.5">{cat.description}</p>
              </div>
              <ChevronRight size={18} color="#6B7A99" />
            </button>
          ))}
        </div>
      </div>
      {isAuthenticated && <BottomNav />}
    </div>
  )
}
''')

w("velora/frontend/src/pages/TutorProfile.tsx", '''import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart, Share2, Star, Monitor, MapPin, Clock, BarChart2, Tag, CheckCircle, MessageCircle } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { tutorsApi } from '../services/api'
import { TutorProfile as TutorProfileType } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'
import { useAuth } from '../contexts/AuthContext'

const LEVEL_LABELS: Record<string, string> = { ALL: 'Todos los niveles', BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' }
const MODE_LABELS: Record<string, string> = { ONLINE: 'Online', PRESENTIAL: 'Presencial', BOTH: 'Online y Presencial' }
const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {}
TUTOR_CATEGORIES.forEach(c => { CATEGORY_COLORS[c.id] = { bg: c.bgColor, color: c.color } })

function getInitials(firstName: string, lastName: string) { return `${firstName[0]}${lastName[0]}`.toUpperCase() }

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [tutor, setTutor] = useState<TutorProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [selectedClassIdx, setSelectedClassIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    tutorsApi.getById(id).then(res => { setTutor(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" /></div>
  if (!tutor) return <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6"><p className="text-[#6B7A99]">Tutor no encontrado</p><button onClick={() => navigate(-1)} className="text-[#3B6FE8] font-medium">Volver</button></div>

  const mainClass = tutor.classes?.[selectedClassIdx] || tutor.classes?.[0]
  const colors = CATEGORY_COLORS[mainClass?.category || 'ACADEMIA'] || { bg: '#F5F3FF', color: '#7C3AED' }
  const includes = mainClass?.includes ? mainClass.includes.split(',') : []

  return (
    <div className="min-h-screen bg-[#F2F4F8] pb-28">
      <header className="flex items-center justify-between px-4 pt-14 pb-3 bg-[#F2F4F8]">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><ChevronLeft size={20} color="#0F1F5C" /></button>
        <div className="flex gap-2">
          <button onClick={() => setIsFav(!isFav)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Heart size={18} color={isFav ? '#E11D48' : '#0F1F5C'} fill={isFav ? '#E11D48' : 'none'} />
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><Share2 size={18} color="#0F1F5C" /></button>
        </div>
      </header>
      <div className="px-4">
        <div className="bg-[#0F1F5C] rounded-3xl p-5 mb-4">
          <span className="px-3 py-1 bg-[#16A34A] text-white text-xs font-medium rounded-full">Disponible ahora</span>
          <h1 className="text-xl font-bold text-white mt-3 mb-2 leading-tight">{mainClass?.title || tutor.headline}</h1>
          <p className="text-white/70 text-sm line-clamp-2 mb-4">{mainClass?.description || tutor.bio}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: colors.color }}>
              {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-medium">{tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}</span>
                {tutor.isVerified && <CheckCircle size={14} color="#3B6FE8" fill="#3B6FE8" />}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star size={13} fill="#D97706" color="#D97706" />
              <span className="text-white text-sm font-bold">{tutor.avgRating.toFixed(1)}</span>
              <span className="text-white/60 text-xs">({tutor.totalReviews})</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: mainClass?.teachingMode === 'ONLINE' ? Monitor : MapPin, label: 'Modalidad', value: MODE_LABELS[mainClass?.teachingMode || 'BOTH'] },
            { icon: Clock, label: 'Duración', value: `${mainClass?.duration || 60} min` },
            { icon: BarChart2, label: 'Nivel', value: LEVEL_LABELS[mainClass?.level || 'ALL'] },
            { icon: Tag, label: 'Precio', value: `${mainClass?.pricePerHour || 0}€/h` },
          ].map((stat) => { const Icon = stat.icon; return (
            <div key={stat.label} className="bg-white rounded-2xl p-3 text-center">
              <Icon size={16} color="#6B7A99" className="mx-auto mb-1" />
              <p className="text-[9px] text-[#6B7A99] mb-0.5">{stat.label}</p>
              <p className="text-[10px] font-semibold text-[#0F1F5C] leading-tight">{stat.value}</p>
            </div>
          )})}
        </div>
        {tutor.classes && tutor.classes.length > 1 && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Clases disponibles</h2>
            <div className="space-y-2">
              {tutor.classes.map((cls, i) => (
                <button key={cls.id} onClick={() => setSelectedClassIdx(i)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-colors ${selectedClassIdx === i ? 'border-[#0F1F5C] bg-[#EEF2FF]' : 'border-gray-100 bg-gray-50'}`}>
                  <div><p className="text-sm font-medium text-[#0F1F5C]">{cls.title}</p><p className="text-xs text-[#6B7A99]">{LEVEL_LABELS[cls.level]}</p></div>
                  <span className="text-sm font-bold text-[#0F1F5C]">{cls.pricePerHour}€/h</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Sobre esta clase</h2>
          <p className="text-sm text-[#6B7A99] leading-relaxed">{mainClass?.description || tutor.bio}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Idiomas</h2>
          <div className="flex flex-wrap gap-2">
            {(tutor.languages || 'Español').split(',').map(lang => (
              <span key={lang} className="px-3 py-1 bg-[#F2F4F8] rounded-full text-sm text-[#0F1F5C]">{lang.trim()}</span>
            ))}
          </div>
        </div>
        {includes.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Qué incluye</h2>
            <div className="grid grid-cols-2 gap-2">
              {includes.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#3B6FE8] font-bold text-sm mt-0.5">&#10003;</span>
                  <span className="text-sm text-[#0F1F5C]">{item.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tutor.city && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Ubicación</h2>
            <div className="flex items-center gap-2 mb-3"><MapPin size={15} color="#6B7A99" /><span className="text-sm text-[#6B7A99]">{tutor.city}</span></div>
            <div className="w-full h-28 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 bg-[#3B6FE8] rounded-full flex items-center justify-center"><MapPin size={12} color="white" fill="white" /></div>
                <span className="text-xs text-[#6B7A99] font-medium">{tutor.city}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex gap-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => isAuthenticated ? navigate(`/booking/${mainClass?.id}`) : navigate('/login')}
          className="flex-1 bg-[#0F1F5C] text-white font-semibold py-4 rounded-xl text-sm">
          Reservar clase · {mainClass?.pricePerHour} € / h
        </button>
        <button className="w-14 h-14 border-2 border-[#0F1F5C] rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageCircle size={20} color="#0F1F5C" />
        </button>
      </div>
      {isAuthenticated && <BottomNav />}
    </div>
  )
}
''')

w("velora/frontend/src/pages/Booking.tsx", '''import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Monitor, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { bookingsApi } from '../services/api'

const STEPS = ['Fecha y hora', 'Detalles', 'Pago', 'Confirmación']
const HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const DAYS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function getDaysOfWeek(weekOffset: number) {
  const today = new Date()
  const days = []
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7)
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
  return days
}

export default function Booking() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHour, setSelectedHour] = useState('')
  const [teachingMode, setTeachingMode] = useState<'PRESENTIAL' | 'ONLINE'>('ONLINE')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const days = getDaysOfWeek(weekOffset)
  const today = new Date()
  const price = 25

  const handleBook = async () => {
    if (!classId || !selectedDate || !selectedHour) return
    setLoading(true)
    try {
      const [h, m] = selectedHour.split(':')
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(parseInt(h), parseInt(m), 0, 0)
      await bookingsApi.create({ classId, scheduledAt: scheduledAt.toISOString(), teachingMode, address: teachingMode === 'PRESENTIAL' ? address : undefined, studentNotes: notes || undefined })
      setStep(3)
    } catch { alert('Error al crear la reserva.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-gray-50">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2"><ChevronLeft size={24} color="#0F1F5C" /></button>
        <h1 className="text-base font-semibold text-[#0F1F5C] flex-1">Reservar clase</h1>
      </header>
      <div className="px-4 py-4 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-[#0F1F5C] text-white' : i < step ? 'bg-[#3B6FE8] text-white' : 'bg-[#F2F4F8] text-[#6B7A99]'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-1 font-medium text-center max-w-[50px] ${i === step ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-8 mx-1 mb-4 ${i < step ? 'bg-[#3B6FE8]' : 'bg-[#F2F4F8]'}`} />}
          </div>
        ))}
      </div>
      <div className="flex-1 px-4 space-y-6 overflow-y-auto">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Selecciona fecha</h2>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} className="w-8 h-8 bg-[#F2F4F8] rounded-lg flex items-center justify-center"><ChevronLeft size={16} color="#6B7A99" /></button>
                <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {days.map((d) => {
                    const isPast = d < today && d.toDateString() !== today.toDateString()
                    const isSelected = selectedDate?.toDateString() === d.toDateString()
                    return (
                      <button key={d.toISOString()} disabled={isPast} onClick={() => setSelectedDate(d)}
                        className={`flex flex-col items-center py-2.5 px-2 rounded-xl min-w-[44px] ${isSelected ? 'bg-[#0F1F5C]' : isPast ? 'opacity-30' : 'bg-[#F2F4F8]'}`}>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-[#6B7A99]'}`}>{DAYS_SHORT[d.getDay()]}</span>
                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#0F1F5C]'}`}>{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 bg-[#F2F4F8] rounded-lg flex items-center justify-center"><ChevronRight size={16} color="#6B7A99" /></button>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Selecciona hora</h2>
              <div className="flex flex-wrap gap-2">
                {HOURS.map(h => <button key={h} onClick={() => setSelectedHour(h)} className={`px-4 py-2 rounded-full text-sm font-medium ${selectedHour === h ? 'bg-[#0F1F5C] text-white' : 'bg-[#F2F4F8] text-[#0F1F5C]'}`}>{h}</button>)}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Modalidad</h2>
              <div className="flex gap-3">
                {(['PRESENTIAL', 'ONLINE'] as const).map(mode => (
                  <button key={mode} onClick={() => setTeachingMode(mode)} className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 ${teachingMode === mode ? 'border-[#0F1F5C] bg-[#EEF2FF]' : 'border-gray-200'}`}>
                    {mode === 'PRESENTIAL' ? <MapPin size={20} color={teachingMode === mode ? '#0F1F5C' : '#6B7A99'} /> : <Monitor size={20} color={teachingMode === mode ? '#0F1F5C' : '#6B7A99'} />}
                    <p className={`text-xs font-semibold ${teachingMode === mode ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>{mode === 'PRESENTIAL' ? 'Presencial' : 'Online'}</p>
                  </button>
                ))}
              </div>
              {teachingMode === 'PRESENTIAL' && (
                <div className="mt-3 relative">
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección completa"
                    className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-10" />
                  {address && <button onClick={() => setAddress('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16} color="#6B7A99" /></button>}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[#0F1F5C]">Notas (opcional)</h2>
                <span className="text-xs text-[#6B7A99]">{notes.length} / 200</span>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value.slice(0, 200))} placeholder="Cuéntale algo al tutor sobre tus objetivos..." rows={3}
                className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none resize-none" />
            </div>
          </>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0F1F5C]">Resumen</h2>
            <div className="bg-[#F2F4F8] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-[#6B7A99]">Fecha</span><span className="text-sm font-medium text-[#0F1F5C]">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#6B7A99]">Hora</span><span className="text-sm font-medium text-[#0F1F5C]">{selectedHour}</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#6B7A99]">Modalidad</span><span className="text-sm font-medium text-[#0F1F5C]">{teachingMode === 'ONLINE' ? 'Online' : 'Presencial'}</span></div>
            </div>
            <div className="bg-[#F2F4F8] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-[#6B7A99]">Precio</span><span className="text-sm font-medium text-[#0F1F5C]">{price} €</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#6B7A99]">Comisión (10%)</span><span className="text-sm font-medium text-[#0F1F5C]">{(price * 0.1).toFixed(2)} €</span></div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between"><span className="text-base font-bold text-[#0F1F5C]">Total</span><span className="text-base font-bold text-[#0F1F5C]">{price} €</span></div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0F1F5C]">Pago</h2>
            <div className="bg-[#F2F4F8] rounded-2xl p-4 text-center py-8">
              <p className="text-sm text-[#6B7A99]">Integración con Stripe disponible en producción.<br />Haz clic en "Confirmar reserva" para continuar.</p>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-6 text-4xl">✓</div>
            <h2 className="text-xl font-bold text-[#0F1F5C] mb-2">¡Reserva confirmada!</h2>
            <p className="text-sm text-[#6B7A99] mb-8">Tu clase ha sido reservada correctamente.</p>
            <button onClick={() => navigate('/home')} className="px-8 py-3 bg-[#0F1F5C] text-white font-semibold rounded-xl">Volver al inicio</button>
          </div>
        )}
      </div>
      {step < 3 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button onClick={step === 2 ? handleBook : () => setStep(step + 1)}
            disabled={loading || (step === 0 && (!selectedDate || !selectedHour))}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-xl text-base disabled:opacity-50">
            {loading ? 'Procesando...' : step === 2 ? `Confirmar · ${price} €` : `Continuar · ${price} € / h`}
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
''')

w("velora/frontend/src/pages/PublishClass.tsx", '''import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, GraduationCap, User, Lightbulb, ChevronDown } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { TUTOR_CATEGORIES } from '../config/categories'

const STEPS = ['Información', 'Detalles', 'Precio', 'Disponibilidad', 'Vista previa']

export default function PublishClass() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'TUTOR' | 'STUDENT'>('TUTOR')
  const [form, setForm] = useState({ title: '', category: '', description: '', pricePerHour: '', level: 'ALL', teachingMode: 'BOTH', language: 'Español', duration: '60', includes: '' })
  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-gray-50">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2"><ChevronLeft size={24} color="#0F1F5C" /></button>
        <h1 className="text-base font-semibold text-[#0F1F5C] flex-1">Publicar clase</h1>
      </header>
      <div className="px-4 py-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === step ? 'bg-[#0F1F5C] text-white' : i < step ? 'bg-[#3B6FE8] text-white' : 'bg-[#F2F4F8] text-[#6B7A99]'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${i === step ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1.5" />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-4 space-y-5 overflow-y-auto">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-base font-semibold text-[#0F1F5C] mb-3">¿Qué quieres publicar?</h2>
              <div className="flex gap-3">
                {([['TUTOR', 'Ofrezco una clase', 'Soy tutor', GraduationCap], ['STUDENT', 'Busco un tutor', 'Soy estudiante', User]] as const).map(([val, label, sub, Icon]) => (
                  <button key={val} onClick={() => setRole(val as any)} className={`flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl border-2 relative ${role === val ? 'border-[#3B6FE8] bg-[#EEF2FF]' : 'border-gray-200'}`}>
                    {role === val && <div className="absolute top-3 right-3 w-5 h-5 bg-[#3B6FE8] rounded-full flex items-center justify-center"><span className="text-white text-[9px]">✓</span></div>}
                    <Icon size={28} color={role === val ? '#3B6FE8' : '#6B7A99'} />
                    <div className="text-center px-2">
                      <p className={`text-xs font-semibold ${role === val ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>{label}</p>
                      <p className="text-[10px] text-[#6B7A99]">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0F1F5C]">Cuéntanos sobre tu clase</h2>
              <div>
                <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Título</label>
                <input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Ej. Clases de Matemáticas para Bachillerato"
                  className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none" />
              </div>
              <div>
                <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Categoría</label>
                <div className="relative">
                  <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none appearance-none">
                    <option value="">Selecciona una categoría</option>
                    {TUTOR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={16} color="#6B7A99" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#6B7A99] font-medium">Descripción</label>
                  <span className="text-xs text-[#6B7A99]">{form.description.length} / 500</span>
                </div>
                <textarea value={form.description} onChange={e => handleChange('description', e.target.value.slice(0, 500))} placeholder="Cuéntales de qué trata tu clase..." rows={4}
                  className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none resize-none" />
              </div>
              <div className="flex gap-2 p-4 rounded-2xl" style={{ backgroundColor: '#FFFBEB' }}>
                <Lightbulb size={18} color="#D97706" className="flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B7A99]">Sé claro y específico. Una buena descripción te ayudará a recibir más reservas.</p>
              </div>
            </div>
          </>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Detalles</h2>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Nivel</label>
              <div className="grid grid-cols-2 gap-2">
                {[['ALL','Todos los niveles'],['BEGINNER','Principiante'],['INTERMEDIATE','Intermedio'],['ADVANCED','Avanzado']].map(([val, label]) => (
                  <button key={val} onClick={() => handleChange('level', val)} className={`py-3 rounded-xl text-sm font-medium border-2 ${form.level === val ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Modalidad</label>
              <div className="grid grid-cols-3 gap-2">
                {[['ONLINE','Online'],['PRESENTIAL','Presencial'],['BOTH','Ambas']].map(([val, label]) => (
                  <button key={val} onClick={() => handleChange('teachingMode', val)} className={`py-3 rounded-xl text-sm font-medium border-2 ${form.teachingMode === val ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Duración (minutos)</label>
              <div className="flex gap-2">
                {['30','45','60','90','120'].map(d => (
                  <button key={d} onClick={() => handleChange('duration', d)} className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 ${form.duration === d ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'}`}>{d}&apos;</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Precio por hora</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1F5C] font-semibold text-lg">€</span>
              <input type="number" value={form.pricePerHour} onChange={e => handleChange('pricePerHour', e.target.value)} placeholder="0"
                className="w-full pl-10 pr-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] text-xl font-bold outline-none" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7A99] text-sm">/ hora</span>
            </div>
            <div className="bg-[#EEF2FF] rounded-2xl p-4">
              <p className="text-xs text-[#3B6FE8] font-medium mb-1">Recibirás</p>
              <p className="text-2xl font-bold text-[#0F1F5C]">{form.pricePerHour ? (parseFloat(form.pricePerHour) * 0.9).toFixed(2) : '0.00'} €</p>
              <p className="text-xs text-[#6B7A99] mt-0.5">Velora retiene un 10% de comisión</p>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Disponibilidad</h2>
            <div className="grid grid-cols-7 gap-1">
              {['L','M','X','J','V','S','D'].map(d => (
                <button key={d} className="aspect-square rounded-xl bg-[#0F1F5C] text-white text-sm font-semibold flex items-center justify-center">{d}</button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1"><label className="text-xs text-[#6B7A99] mb-1 block">Desde</label><input type="time" defaultValue="09:00" className="w-full px-3 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none" /></div>
              <div className="flex-1"><label className="text-xs text-[#6B7A99] mb-1 block">Hasta</label><input type="time" defaultValue="20:00" className="w-full px-3 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none" /></div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Vista previa</h2>
            <div className="bg-[#0F1F5C] rounded-3xl p-5">
              <span className="px-3 py-1 bg-[#16A34A] text-white text-xs font-medium rounded-full">Disponible</span>
              <h3 className="text-xl font-bold text-white mt-3 mb-2">{form.title || 'Título de tu clase'}</h3>
              <p className="text-white/70 text-sm line-clamp-2">{form.description || 'Descripción de la clase...'}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between">
              <div><p className="text-xs text-[#6B7A99]">Precio</p><p className="text-lg font-bold text-[#0F1F5C]">{form.pricePerHour || '0'} € / h</p></div>
              <div><p className="text-xs text-[#6B7A99]">Nivel</p><p className="text-sm font-medium text-[#0F1F5C]">{form.level === 'ALL' ? 'Todos' : form.level}</p></div>
              <div><p className="text-xs text-[#6B7A99]">Modalidad</p><p className="text-sm font-medium text-[#0F1F5C]">{form.teachingMode}</p></div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : navigate('/home')}
          className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-xl text-base">
          {step === STEPS.length - 1 ? 'Publicar clase' : 'Siguiente'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
''')

w("velora/frontend/src/pages/Messages.tsx", '''import { MessageCircle } from 'lucide-react'
import BottomNav from '../components/BottomNav'

const mockConversations = [
  { id: '1', name: 'Laura García', lastMessage: 'Perfecto, nos vemos el lunes a las 10:00', time: '10:32', unread: 2, color: '#0891B2' },
  { id: '2', name: 'Carlos Martínez', lastMessage: 'He enviado los detalles de la pista', time: 'Ayer', unread: 0, color: '#16A34A' },
  { id: '3', name: 'David Rodríguez', lastMessage: '¿Pudiste instalar Python correctamente?', time: 'Ayer', unread: 1, color: '#3B6FE8' },
]

function getInitials(name: string) { return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) }

export default function Messages() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-[#0F1F5C]">Mensajes</h1>
        <p className="text-sm text-[#6B7A99] mt-0.5">Tus conversaciones</p>
      </header>
      <div className="px-4">
        {mockConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-[#F2F4F8] rounded-full flex items-center justify-center"><MessageCircle size={28} color="#6B7A99" /></div>
            <p className="text-[#6B7A99] text-sm text-center">No tienes mensajes aún.<br />Reserva una clase para empezar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {mockConversations.map((conv) => (
              <button key={conv.id} className="flex items-center gap-3 py-4 w-full text-left">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: conv.color }}>
                  {getInitials(conv.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0F1F5C]">{conv.name}</p>
                    <span className="text-xs text-[#6B7A99]">{conv.time}</span>
                  </div>
                  <p className="text-xs text-[#6B7A99] truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-[#0F1F5C] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
''')

w("velora/frontend/src/pages/Profile.tsx", '''import { useNavigate } from 'react-router-dom'
import { User, Settings, Star, BookMarked, LogOut, ChevronRight, Shield } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/login') }
  const getInitials = () => user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U'

  const menuItems = [
    { icon: BookMarked, label: 'Mis reservas', path: '/bookings' },
    { icon: Star, label: 'Mis reseñas', path: '/reviews' },
    { icon: Shield, label: 'Verificación', path: '/verify' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#F2F4F8] pb-20">
      <div className="bg-white px-4 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#0F1F5C] flex items-center justify-center text-white text-2xl font-bold">{getInitials()}</div>
          <div>
            <h1 className="text-xl font-bold text-[#0F1F5C]">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-[#6B7A99]">{user?.email}</p>
            {user?.tutorProfile && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} fill="#D97706" color="#D97706" />
                <span className="text-xs font-medium text-[#0F1F5C]">{user.tutorProfile.avgRating.toFixed(1)}</span>
                <span className="text-xs text-[#6B7A99]">· Tutor verificado</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        {!user?.tutorProfile && (
          <button onClick={() => navigate('/publish')} className="w-full flex items-center justify-between p-4 bg-[#0F1F5C] rounded-2xl">
            <div>
              <p className="text-white font-semibold text-sm">Conviértete en tutor</p>
              <p className="text-white/70 text-xs mt-0.5">Empieza a enseñar y gana dinero</p>
            </div>
            <ChevronRight size={20} color="white" />
          </button>
        )}
        <div className="bg-white rounded-2xl overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-[#F2F4F8] rounded-xl flex items-center justify-center"><Icon size={18} color="#0F1F5C" /></div>
                <span className="text-sm font-medium text-[#0F1F5C] flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} color="#6B7A99" />
              </button>
            )
          })}
        </div>
        <div className="bg-white rounded-2xl overflow-hidden">
          <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-4 w-full">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><LogOut size={18} color="#E11D48" /></div>
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
''')

print("\nTodos los archivos creados correctamente!")
print("\nPasos a seguir:")
print("  1. cd velora/backend && npm install && npx prisma generate && npx prisma db push && npm run seed")
print("  2. cd ../frontend && npm install")
print("  3. cd ../.. && git add velora/ && git commit -m 'feat: add Velora tutoring marketplace' && git push -u origin claude/build-velora-marketplace-XkK3x")
