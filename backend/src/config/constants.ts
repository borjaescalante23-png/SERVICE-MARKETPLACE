export const PLATFORM_FEE_PERCENTAGE = 0.15;
export const ESCROW_AUTO_RELEASE_HOURS = parseInt(process.env.ESCROW_RELEASE_HOURS || '24');
export const MIN_EXPERIENCE_ENTRIES = 2;
export const MIN_EXPERIENCE_IMAGES_PER_ENTRY = 1;
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');

export const SENSITIVE_DATA_PATTERNS = [
  /(\+?[\d\s\-().]{9,15})/g,
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  /(https?:\/\/[^\s]+)/gi,
  /(wa\.me|whatsapp|telegram|t\.me)/gi,
  /(instagram\.com|facebook\.com|tiktok\.com)/gi,
];

export const SERVICE_CATEGORIES = [
  'HAIRDRESSING', 'BEAUTY', 'CLEANING', 'CHEF', 'HANDYMAN',
  'PERSONAL_TRAINER', 'MASSAGE', 'CHILDCARE', 'ELDERCARE',
  'PET_CARE', 'TUTORING', 'OTHER',
];

export const BOOKING_STATUSES = [
  'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED',
];
