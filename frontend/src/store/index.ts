import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Employee, Invoice, PaymentLink, Transaction, Toast } from '../types'
import { MOCK_EMPLOYEES, MOCK_INVOICES, MOCK_PAYMENT_LINKS, MOCK_TRANSACTIONS } from '../lib/mockData'
import { randomHex, encryptedAmount } from '../lib/utils'
import { UmbraService } from '../lib/umbra'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, company: string, wallet: string) => Promise<boolean>
  logout: () => void

  // UI
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  balancesMasked: boolean
  toggleBalanceMask: () => void

  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Data
  employees: Employee[]
  invoices: Invoice[]
  paymentLinks: PaymentLink[]
  transactions: Transaction[]
  fetchEmployees: () => Promise<void>
  fetchInvoices: () => Promise<void>
  fetchPaymentLinks: () => Promise<void>
  fetchTransactions: () => Promise<void>

  // Payroll
  addEmployee: (emp: Omit<Employee, 'id' | 'employerId'>) => Promise<void>
  removeEmployee: (id: string) => void
  runPayroll: (employeeIds: string[]) => Promise<void>

  // Invoices
  addInvoice: (inv: Omit<Invoice, 'id' | 'creatorId' | 'invoiceNumber' | 'paymentLink' | 'createdAt'>) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void

  // Compliance
  decryptTransaction: (txHash: string, viewingKey: string) => Promise<Response>

  // Payment links
  createPaymentLink: (link: Omit<PaymentLink, 'id' | 'link' | 'createdAt'>) => Promise<void>
  claimPaymentLink: (id: string) => Promise<void>

  // Processing states
  isProcessingPayroll: boolean
  isCreatingInvoice: boolean
  isGeneratingLink: boolean
}

const DEMO_USER: User = {
  id: 'usr-001',
  email: 'demo@stealthpay.io',
  walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  companyName: 'Acme Corp',
  createdAt: '2024-01-01T00:00:00Z',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()
          if (res.ok) {
            set({ user: data.user, isAuthenticated: true })
            localStorage.setItem('stealthpay_token', data.access_token)
            return true
          }
          return false
        } catch (err) {
          console.error('Login error:', err)
          return false
        }
      },

      signup: async (email: string, password: string, company: string, wallet: string) => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              password, 
              company_name: company, 
              wallet_address: wallet 
            }),
          })
          const data = await res.json()
          if (res.ok) {
            set({ user: data.user, isAuthenticated: true })
            localStorage.setItem('stealthpay_token', data.access_token)
            return true
          }
          return false
        } catch (err) {
          console.error('Signup error:', err)
          return false
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('stealthpay_token')
      },

      sidebarCollapsed: false,
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      balancesMasked: true,
      toggleBalanceMask: () => set(s => ({ balancesMasked: !s.balancesMasked })),

      toasts: [],
      addToast: (toast) => {
        const id = randomHex(8)
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => get().removeToast(id), toast.duration ?? 5000)
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      employees: [],
      invoices: [],
      paymentLinks: [],
      transactions: MOCK_TRANSACTIONS,

      fetchEmployees: async () => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/payroll/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ employees: data })
        }
      },

      addEmployee: async (emp) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/payroll/employees', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(emp),
        })
        if (res.ok) {
          get().fetchEmployees()
          get().addToast({ type: 'success', title: 'Employee Added' })
        }
      },

      removeEmployee: async (id) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(`/api/payroll/employees/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          get().fetchEmployees()
          get().addToast({ type: 'info', title: 'Employee Removed' })
        }
      },

      isProcessingPayroll: false,
      runPayroll: async (employeeIds) => {
        set({ isProcessingPayroll: true })
        const token = localStorage.getItem('stealthpay_token')
        const now = new Date().toISOString()
        
        try {
          const newTransactions: Transaction[] = []
          
          for (const eid of employeeIds) {
            const emp = get().employees.find(e => e.id === eid)
            if (!emp) continue

            // 1. Prepare Confidential Transfer via Umbra
            const umbraData = await UmbraService.confidentialTransfer(null, emp.walletAddress, emp.salary, emp.currency)
            
            // 2. Submit to Backend
            const res = await fetch('/api/payroll/run', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                employee_ids: [eid],
                umbra_metadata: umbraData
              }),
            })
            
            if (res.ok) {
              const data = await res.json()
              const tx = data.transactions[0]
              newTransactions.push({
                id: `tx-${randomHex(6)}`,
                txHash: tx.tx_hash,
                sender: get().user?.walletAddress ?? 'System',
                receiver: 'Encrypted',
                encryptedAmount: umbraData.encryptedAmount,
                currency: emp.currency,
                type: 'payroll',
                status: 'confirmed',
                timestamp: now,
                memo: `Payroll Transfer (via Umbra)`,
                viewingKey: tx.viewing_key
              })
            }
          }
          
          set(s => ({
            transactions: [...newTransactions, ...s.transactions],
            isProcessingPayroll: false,
          }))
          get().fetchEmployees()
          get().addToast({ 
            type: 'success', 
            title: 'Payroll Sent', 
            message: `${newTransactions.length} confidential transfers complete via Umbra Protocol` 
          })
        } catch (err) {
          set({ isProcessingPayroll: false })
          get().addToast({ type: 'error', title: 'Payroll Failed' })
        }
      },
      fetchTransactions: async () => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/compliance/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ transactions: data })
        }
      },

      fetchInvoices: async () => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/invoices/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ invoices: data })
        }
      },

      isCreatingInvoice: false,
      addInvoice: async (inv) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/invoices/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(inv),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'success', title: 'Invoice Created' })
        }
      },

      updateInvoiceStatus: async (id, status) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(`/api/invoices/${id}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'info', title: 'Invoice Updated', message: `Status changed to ${status}` })
        }
      },

      decryptTransaction: async (txHash: string, viewingKey: string) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/compliance/decrypt', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tx_hash: txHash, viewing_key: viewingKey }),
        })
        return res
      },

      fetchPaymentLinks: async () => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/payment-links/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ paymentLinks: data })
        }
      },

      isGeneratingLink: false,
      createPaymentLink: async (link) => {
        set({ isGeneratingLink: true })
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/payment-links/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(link),
        })
        set({ isGeneratingLink: false })
        if (res.ok) {
          get().fetchPaymentLinks()
          get().addToast({ type: 'success', title: 'Payment Link Created', message: 'Secure private payment link generated' })
        }
      },

      claimPaymentLink: async (id) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(`/api/payment-links/${id}/claim`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ wallet_address: get().user?.walletAddress }),
        })
        if (res.ok) {
          get().fetchPaymentLinks()
          get().addToast({ type: 'success', title: 'Payment Link Claimed', message: 'Private payment received via Umbra' })
        }
      },
    }),
    {
      name: 'stealthpay-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
        balancesMasked: state.balancesMasked,
      }),
    }
  )
)
