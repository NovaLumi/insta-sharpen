// Application constants

// Default credits for new users
export const DEFAULT_CREDITS = 3

// Upscale configuration
export const UPSCALE_COST_MAP: Record<string, number> = {
  '2': 2,
  '4': 4,
  '8': 8,
}

export const VALID_UPSCALE_FACTORS = ['2', '4', '8']

// Polling configuration
export const POLL_INTERVAL_MS = 1000
export const MAX_POLL_ATTEMPTS = 120 // 2 minutes max

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Storage bucket name
export const STORAGE_BUCKET = 'images'
