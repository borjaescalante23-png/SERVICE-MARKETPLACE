export type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
export type ProfessionalLevel = 'VERIFIED' | 'PRO' | 'ELITE';
export type ServiceMode = 'PRESENTIAL' | 'REMOTE' | 'BOTH';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED_BY_PROVIDER' | 'COMPLETED' | 'AUTO_COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentStatus = 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export type ServiceCategory =
  | 'HAIRDRESSING' | 'BEAUTY' | 'CLEANING' | 'CHEF' | 'HANDYMAN'
  | 'PERSONAL_TRAINER' | 'MASSAGE' | 'CHILDCARE' | 'ELDERCARE' | 'PET_CARE'
  | 'TUTORING' | 'PLUMBING' | 'ELECTRICIAN' | 'GARDENING' | 'OTHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isProvider: boolean;
  avatarUrl?: string;
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
  stripeConnectId?: string;
  stripeConnectStatus?: string;
  selfieUrl?: string;
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
  CHEF: 'Chef',
  HANDYMAN: 'Manitas',
  PERSONAL_TRAINER: 'Entrenador Personal',
  MASSAGE: 'Masajes',
  CHILDCARE: 'Cuidado Infantil',
  ELDERCARE: 'Cuidado de Mayores',
  PET_CARE: 'Cuidado de Mascotas',
  TUTORING: 'Tutorías',
  PLUMBING: 'Fontanería',
  ELECTRICIAN: 'Electricista',
  GARDENING: 'Jardinería',
  OTHER: 'Otros',
};

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  HAIRDRESSING: '✂️',
  BEAUTY: '💅',
  CLEANING: '🧹',
  CHEF: '👨‍🍳',
  HANDYMAN: '🛠️',
  PERSONAL_TRAINER: '💪',
  MASSAGE: '🧘',
  CHILDCARE: '👶',
  ELDERCARE: '👴',
  PET_CARE: '🐾',
  TUTORING: '📚',
  PLUMBING: '🚰',
  ELECTRICIAN: '⚡',
  GARDENING: '🌿',
  OTHER: '⭐',
};

export const CATEGORY_IMAGES: Record<ServiceCategory, string> = {
  HAIRDRESSING:     'https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  BEAUTY:           'https://images.pexels.com/photos/12115045/pexels-photo-12115045.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  CLEANING:         'https://images.pexels.com/photos/9462192/pexels-photo-9462192.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  CHEF:             'https://images.pexels.com/photos/36430249/pexels-photo-36430249.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  HANDYMAN:         'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PERSONAL_TRAINER: 'https://images.pexels.com/photos/4587383/pexels-photo-4587383.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  MASSAGE:          'https://images.pexels.com/photos/6629607/pexels-photo-6629607.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  CHILDCARE:        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=85&auto=format&fit=crop',
  ELDERCARE:        'https://images.pexels.com/photos/29372722/pexels-photo-29372722.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PET_CARE:         'https://images.pexels.com/photos/6235650/pexels-photo-6235650.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  TUTORING:         'https://images.pexels.com/photos/10222299/pexels-photo-10222299.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  PLUMBING:         'https://images.pexels.com/photos/29226620/pexels-photo-29226620.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  ELECTRICIAN:      'https://images.pexels.com/photos/32497160/pexels-photo-32497160.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  GARDENING:        'https://images.pexels.com/photos/16442678/pexels-photo-16442678.jpeg?auto=compress&cs=tinysrgb&w=800&h=533&fit=crop',
  OTHER:            'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=85&auto=format&fit=crop',
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
