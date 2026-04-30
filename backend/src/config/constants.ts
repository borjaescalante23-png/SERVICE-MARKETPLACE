export const PLATFORM_FEE_PERCENTAGE = 0.15;

// ── Geographic restriction: Barcelona only ──
export const PLATFORM_CITY = 'Barcelona';
export const PLATFORM_COUNTRY = 'España';
export const PLATFORM_COUNTRY_CODE = 'ES';
export const BARCELONA_CENTER = { lat: 41.3851, lng: 2.1734 };
export const BARCELONA_BOUNDS = {
  MIN_LAT: 41.25,
  MAX_LAT: 41.55,
  MIN_LNG: 1.90,
  MAX_LNG: 2.35,
};
export function isWithinBarcelona(lat: number, lng: number): boolean {
  return (
    lat >= BARCELONA_BOUNDS.MIN_LAT && lat <= BARCELONA_BOUNDS.MAX_LAT &&
    lng >= BARCELONA_BOUNDS.MIN_LNG && lng <= BARCELONA_BOUNDS.MAX_LNG
  );
}
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
  'PERSONAL_TRAINER', 'MASSAGE', 'ELDERCARE',
  'PET_CARE', 'TUTORING', 'PLUMBING', 'ELECTRICIAN', 'GARDENING',
];

export const BOOKING_STATUSES = [
  'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED',
];
