import { VerificationStatus, BookingStatus } from '../../types';

const verificationColors: Record<VerificationStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

const bookingColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  DISPUTED: 'bg-red-100 text-red-700',
};

interface BadgeProps {
  label: string;
  type?: 'verification' | 'booking' | 'custom';
  status?: VerificationStatus | BookingStatus;
  color?: string;
}

export default function Badge({ label, type, status, color }: BadgeProps) {
  let classes = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ';

  if (color) {
    classes += color;
  } else if (type === 'verification' && status) {
    classes += verificationColors[status as VerificationStatus];
  } else if (type === 'booking' && status) {
    classes += bookingColors[status as BookingStatus];
  } else {
    classes += 'bg-gray-100 text-gray-700';
  }

  return <span className={classes}>{label}</span>;
}
