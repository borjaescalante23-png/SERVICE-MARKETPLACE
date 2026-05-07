export interface User {
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
