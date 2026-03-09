interface PayPalButtonComponent {
  render: (container: string | HTMLElement) => void
  close: () => void
}

interface PayPalButtonsOptions {
  style?: {
    layout?: 'vertical' | 'horizontal'
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black'
    shape?: 'rect' | 'pill'
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay'
    height?: number
  }
  createOrder: () => Promise<string>
  onApprove: (data: { orderID: string }, actions?: { restart: () => void }) => Promise<void>
  onError?: (err: unknown) => void
  onCancel?: () => void
}

interface PayPalSDK {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonComponent
}

declare global {
  interface Window {
    paypal?: PayPalSDK
  }
}

export {}
