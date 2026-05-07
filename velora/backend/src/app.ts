import express from 'express'
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
