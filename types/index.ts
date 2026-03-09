export type UpscaleFactor = '2x' | '4x' | '8x'

export interface UpscaleOption {
  factor: UpscaleFactor
  label: string
  description: string
  cost: number
  recommended?: boolean
}

export const UPSCALE_OPTIONS: UpscaleOption[] = [
  {
    factor: '2x',
    label: '2x (HD)',
    description: 'Fast',
    cost: 2,
  },
  {
    factor: '4x',
    label: '4x (4K)',
    description: 'Recommended',
    cost: 4,
    recommended: true,
  },
  {
    factor: '8x',
    label: '8x (Ultra)',
    description: 'Maximum Detail',
    cost: 8,
  },
]

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
