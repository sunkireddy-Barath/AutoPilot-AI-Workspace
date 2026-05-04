export interface User {
  id: string
  email: string
  walletAddress: string
  companyName: string
  createdAt: string
}

export interface Employee {
  id: string
  employerId: string
  name: string
  email: string
  walletAddress: string
  salary: number
  currency: string
  department: string
  status: 'active' | 'inactive'
  lastPaid?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  creatorId: string
  clientName: string
  clientEmail: string
  amount: number
  currency: string
  description: string
  paymentLink: string
  status: 'draft' | 'pending' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
  txHash?: string
}

export interface PaymentLink {
  id: string
  title: string
  amount: number
  currency: string
  link: string
  qrCode?: string
  status: 'active' | 'claimed' | 'expired'
  expiresAt?: string
  createdAt: string
  claimedAt?: string
  claimedBy?: string
}

export interface Transaction {
  id: string
  txHash: string
  sender: string
  receiver: string
  encryptedAmount: string
  amount?: number
  currency: string
  type: 'payroll' | 'invoice' | 'payment_link' | 'transfer'
  status: 'pending' | 'confirmed' | 'failed'
  viewingKey?: string
  timestamp: string
  memo?: string
}

export interface WalletBalance {
  token: string
  symbol: string
  encryptedBalance: string
  balance?: number
  usdValue?: number
  percentChange24h?: number
}

export interface PayrollRun {
  id: string
  runDate: string
  employeeCount: number
  totalAmount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHashes: string[]
}

export interface DecryptedTransaction {
  txHash: string
  sender: string
  receiver: string
  amount: number
  currency: string
  timestamp: string
  memo?: string
  type: string
}

export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}
