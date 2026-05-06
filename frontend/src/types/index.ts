export type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
export type ProfessionalLevel = 'VERIFIED' | 'PRO' | 'ELITE';
export type ServiceMode = 'PRESENTIAL' | 'REMOTE' | 'BOTH';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED_BY_PROVIDER' | 'COMPLETED' | 'AUTO_COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export type ServiceCategory =
  | 'HAIRDRESSING' | 'BEAUTY' | 'CLEANING' | 'CHEF' | 'HANDYMAN'
  | 'PERSONAL_TRAINER' | 'MASSAGE' | 'ELDERCARE' | 'PET_CARE'
  | 'TUTORING' | 'PLUMBING' | 'ELECTRICIAN' | 'GARDENING'
  | 'YOGA' | 'PILATES' | 'PAINTING' | 'LOCKSMITH' | 'IRONING'
  | 'FURNITURE' | 'POOL' | 'UPHOLSTERY' | 'AESTHETICS' | 'MANICURE'
  | 'MAKEUP' | 'PHYSIOTHERAPY' | 'NUTRITION' | 'TENNIS' | 'PADEL'
  | 'BOXING' | 'LANGUAGES' | 'MUSIC' | 'ART_CLASSES' | 'DANCE'
  | 'COOKING_CLASS' | 'ELDERLY_CARE' | 'CHILDCARE' | 'DOG_WALKING'
  | 'TECH_SUPPORT' | 'WEB_DESIGN' | 'PHOTOGRAPHY' | 'MOVING'
  | 'CATERING' | 'VIDEO' | 'DJ';

export type ServiceGroup = 'HOGAR' | 'BIENESTAR' | 'DEPORTE' | 'CLASES' | 'CUIDADOS' | 'TECNOLOGIA' | 'OTROS';

export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isProvider: boolean;
  avatarUrl?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  language?: string;
  notifSettings?: string;
  theme?: string;
  professionalProfile?: ProfessionalProfile;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  bio?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  avgRating: number;
  totalReviews: number;
  acceptanceRate: number;
  cancellationRate: number;
  completedJobs: number;
  isVisible: boolean;
  level: ProfessionalLevel;
  city?: string;
  country?: string;
  serviceMode: ServiceMode;
  kycStatus?: string;
  travelRadius?: number;
  stripeConnectId?: string;
  stripeConnectStatus?: string;
  selfieUrl?: string;
  rejectionReason?: string;
  user?: { firstName: string; lastName: string; avatarUrl?: string; createdAt?: string };
  services?: Service[];
  experienceEntries?: ExperienceEntry[];
  documents?: VerificationDocument[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  description: string;
  serviceCategory: ServiceCategory;
  approximateDate: string;
  images: ExperienceImage[];
}

export interface ExperienceImage {
  id: string;
  fileUrl: string;
  originalName: string;
}

export interface VerificationDocument {
  id: string;
  type: string;
  fileUrl: string;
  originalName: string;
  status: VerificationStatus;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  isActive: boolean;
  professionalId: string;
  hasAssessmentVisit?: boolean;
  assessmentPrice?: number;
}

export interface DisputeAIAnalysis {
  id: string;
  resolution: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RELEASE_PAYMENT';
  confidence: number;
  reasoning: string;
  partialAmount?: number;
  executedAt?: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  openedBy: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  aiAnalysis?: DisputeAIAnalysis;
}

export interface Booking {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  address: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  completedByProviderAt?: string;
  autoReleaseAt?: string;
  cancelledAt?: string;
  providerEvidenceNote?: string;
  totalAmount: number;
  platformFee: number;
  professionalAmount: number;
  clientNotes?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringIntervalDays?: number;
  recurringEndDate?: string;
  parentBookingId?: string;
  createdAt: string;
  service?: Service;
  client?: { firstName: string; lastName: string; avatarUrl?: string };
  professional?: ProfessionalProfile;
  review?: Review;
  escrow?: EscrowTransaction;
  messages?: Message[];
  dispute?: Dispute;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  qualityScore?: number;
  punctualityScore?: number;
  communicationScore?: number;
  createdAt: string;
  client?: { firstName: string; avatarUrl?: string };
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  isFlagged: boolean;
  isRead: boolean;
  createdAt: string;
  sender?: { firstName: string; role: Role; avatarUrl?: string };
  warning?: string;
}

export interface EscrowTransaction {
  id: string;
  amount: number;
  status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  heldAt: string;
  releasedAt?: string;
  releaseScheduledAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  HAIRDRESSING: 'Peluquería',
  BEAUTY: 'Estética',
  CLEANING: 'Limpieza',
  CHEF: 'Chef a Domicilio',
  HANDYMAN: 'Manitas',
  PERSONAL_TRAINER: 'Entrenador Personal',
  MASSAGE: 'Masajes',
  ELDERCARE: 'Cuidado de Mayores',
  ELDERLY_CARE: 'Cuidado de Mayores',
  PET_CARE: 'Cuidado de Mascotas',
  TUTORING: 'Tutorías',
  PLUMBING: 'Fontanería',
  ELECTRICIAN: 'Electricista',
  GARDENING: 'Jardinería',
  YOGA: 'Yoga',
  PILATES: 'Pilates',
  PAINTING: 'Pintura',
  LOCKSMITH: 'Cerrajería',
  IRONING: 'Planchado',
  FURNITURE: 'Montaje de Muebles',
  POOL: 'Piscinas',
  UPHOLSTERY: 'Tapicería',
  AESTHETICS: 'Estética Avanzada',
  MANICURE: 'Manicura y Pedicura',
  MAKEUP: 'Maquillaje',
  PHYSIOTHERAPY: 'Fisioterapia',
  NUTRITION: 'Nutrición',
  TENNIS: 'Tenis',
  PADEL: 'Pádel',
  BOXING: 'Boxeo',
  LANGUAGES: 'Idiomas',
  MUSIC: 'Música',
  ART_CLASSES: 'Clases de Arte',
  DANCE: 'Baile',
  COOKING_CLASS: 'Cocina',
  CHILDCARE: 'Cuidado de Niños',
  DOG_WALKING: 'Paseo de Perros',
  TECH_SUPPORT: 'Soporte Técnico',
  WEB_DESIGN: 'Diseño Web',
  PHOTOGRAPHY: 'Fotografía',
  MOVING: 'Mudanzas',
  CATERING: 'Catering',
  VIDEO: 'Video y Edición',
  DJ: 'DJ',
};

export const CATEGORY_ICONS: Partial<Record<ServiceCategory, string>> = {
  HAIRDRESSING: '✂️',
  BEAUTY: '💅',
  CLEANING: '🧹',
  CHEF: '👨‍🍳',
  HANDYMAN: '🛠️',
  PERSONAL_TRAINER: '💪',
  MASSAGE: '🧘',
  ELDERCARE: '👴',
  ELDERLY_CARE: '👴',
  PET_CARE: '🐾',
  TUTORING: '📚',
  PLUMBING: '🚰',
  ELECTRICIAN: '⚡',
  GARDENING: '🌿',
};

export const CATEGORY_IMAGES: Partial<Record<ServiceCategory, string>> = {
  HAIRDRESSING:     '/velora/img_8.jpg',
  BEAUTY:           '/velora/img_8.jpg',
  CLEANING:         '/velora/img_6.jpg',
  CHEF:             '/velora/img_13.jpg',
  HANDYMAN:         'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PERSONAL_TRAINER: '/velora/img_10.jpg',
  MASSAGE:          '/velora/img_9.jpg',
  ELDERCARE:        'https://images.pexels.com/photos/29372722/pexels-photo-29372722.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  ELDERLY_CARE:     'https://images.pexels.com/photos/29372722/pexels-photo-29372722.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PET_CARE:         'https://images.pexels.com/photos/6235650/pexels-photo-6235650.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  TUTORING:         'https://images.pexels.com/photos/10222299/pexels-photo-10222299.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PLUMBING:         '/velora/img_7.jpg',
  ELECTRICIAN:      '/velora/img_12.jpg',
  GARDENING:        '/velora/img_11.jpg',
  YOGA:             'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PILATES:          'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PAINTING:         'https://images.pexels.com/photos/1463530/pexels-photo-1463530.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  MANICURE:         'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  MAKEUP:           'https://images.pexels.com/photos/2661214/pexels-photo-2661214.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PHYSIOTHERAPY:    'https://images.pexels.com/photos/5473182/pexels-photo-5473182.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  NUTRITION:        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  TENNIS:           'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PADEL:            'https://images.pexels.com/photos/8224707/pexels-photo-8224707.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  BOXING:           'https://images.pexels.com/photos/4754146/pexels-photo-4754146.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  LANGUAGES:        'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  MUSIC:            'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  DANCE:            'https://images.pexels.com/photos/1701195/pexels-photo-1701195.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  COOKING_CLASS:    'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  CHILDCARE:        'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  DOG_WALKING:      'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  TECH_SUPPORT:     'https://images.pexels.com/photos/5473337/pexels-photo-5473337.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PHOTOGRAPHY:      'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  CATERING:         'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED_BY_PROVIDER: 'Completado por proveedor',
  COMPLETED: 'Completada',
  AUTO_COMPLETED: 'Completada automáticamente',
  CANCELLED: 'Cancelada',
  DISPUTED: 'En Disputa',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En Revisión',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  SUSPENDED: 'Suspendido',
};
