import { Currency } from '@/lib/currency'

export type Gateway = 'paystack' | 'bachs'

export type PaymentReference = string

export interface InitializePaymentInput {
  orderNumber: string
  amount: string // decimal string
  currency: Currency
  customerEmail: string
  customerName?: string
  metadata?: Record<string, unknown>
}

export interface InitializedPayment {
  gateway: Gateway
  paymentUrl: string | null
  reference: string
  accessCode?: string
}

export interface VerifyResult {
  success: boolean
  status: string // paid, failed, pending
  paidAt?: string
  message?: string
}
