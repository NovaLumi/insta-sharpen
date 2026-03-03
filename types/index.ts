export type EngineMode = 'standard' | 'pro' | 'face'

export interface ProcessingResult {
  url: string
  originalWidth: number
  originalHeight: number
  upscaledWidth: number
  upscaledHeight: number
}

export interface CreditsInfo {
  amount: number
  isPro: boolean
}
