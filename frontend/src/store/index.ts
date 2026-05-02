import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UmbraService } from '../lib/umbra'

interface User {
  id: string
  email: string
  walletAddress: string
  companyName: string
  umbra_spending_key?: string
  umbra_viewing_key?: string
  createdAt: string
}

interface Employee {
  id: string
  name: string
  email: string
  wallet_address: string
  salary: number
  currency: string
  department: string
  status: string
  lastPaid?: string
}

interface Transaction {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount?: number
  encryptedAmount?: string
  currency: string
  type: 'payroll' | 'invoice' | 'payment_link'
  status: 'confirmed' | 'pending' | 'failed'
  timestamp: string
  memo?: string
  viewingKey?: string
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  amount: number
  currency: string
  description: string
  status: 'pending' | 'paid' | 'overdue' | 'draft'
  due_date: string
  payment_link?: string
}

interface PaymentLink {
  id: string
  title: string
  amount: number
  currency: string
  status: 'active' | 'claimed' | 'expired'
  url: string
  createdAt: string
  claimedBy?: string
}

interface Balance {
  token: string
  symbol: string
  amount: number
  price: number
  usdValue: number
  percentChange24h: number
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  balancesMasked: boolean
  toggleBalanceMask: () => void
  
  toasts: { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; duration?: number }[]
  addToast: (toast: Omit<AppState['toasts'][0], 'id'>) => void
  removeToast: (id: string) => void
  
  employees: Employee[]
  fetchEmployees: () => Promise<void>
  addEmployee: (emp: Partial<Employee>) => Promise<void>
  removeEmployee: (id: string) => Promise<void>
  
  isProcessingPayroll: boolean
  runPayroll: (employeeIds: string[]) => Promise<void>
  
  invoices: Invoice[]
  fetchInvoices: () => Promise<void>
  createInvoice: (inv: Partial<Invoice>) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>
  
  paymentLinks: PaymentLink[]
  fetchPaymentLinks: () => Promise<void>
  createPaymentLink: (link: Partial<PaymentLink>) => Promise<void>
  
  transactions: Transaction[]
  fetchTransactions: () => Promise<void>
  
  balances: Balance[]
  fetchBalances: () => Promise<void>
}

const randomHex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

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
      transactions: [],
      balances: [],

      fetchBalances: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch('/api/wallet/balances', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            set({ balances: data })
          }
        } catch (e) { console.error(e) }
      },

      fetchEmployees: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch('/api/payroll/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            set({ employees: data })
          }
        } catch (e) { console.error(e) }
      },

      fetchTransactions: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            const mapped = data.map((tx: any) => ({
              id: tx.id,
              txHash: tx.tx_hash,
              sender: tx.sender,
              receiver: tx.receiver,
              encryptedAmount: tx.encrypted_amount,
              currency: 'USDC',
              type: tx.type,
              status: tx.status,
              timestamp: tx.created_at,
              memo: tx.memo,
              viewingKey: tx.viewing_key
            }))
            set({ transactions: mapped })
          }
        } catch (e) { console.error(e) }
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
        
        try {
          for (const eid of employeeIds) {
            const emp = get().employees.find(e => e.id === eid)
            if (!emp) continue

            // 1. Prepare Confidential Transfer via Umbra
            const umbraData = await UmbraService.confidentialTransfer(null, emp.wallet_address, emp.salary, 'USDC')
            
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
            
            if (!res.ok) throw new Error('Backend sync failed')
          }
          
          get().addToast({ 
            type: 'success', 
            title: 'Payroll Complete', 
            message: `Successfully processed ${employeeIds.length} private transfers.` 
          })
          
          await get().fetchEmployees()
          await get().fetchTransactions()
          await get().fetchBalances()
          
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Payroll Failed', message: err.message })
        } finally {
          set({ isProcessingPayroll: false })
        }
      },

      fetchInvoices: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        const res = await fetch('/api/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ invoices: data })
        }
      },

      createInvoice: async (inv) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            client_name: inv.client_name,
            client_email: inv.client_email,
            amount: inv.amount,
            currency: inv.currency,
            description: inv.description,
            due_date: inv.due_date
          }),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'success', title: 'Invoice Created' })
        }
      },

      updateInvoiceStatus: async (id, status) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(`/api/invoices/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'info', title: 'Invoice Updated' })
        }
      },

      fetchPaymentLinks: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        const res = await fetch('/api/payment-links', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ paymentLinks: data })
        }
      },

      createPaymentLink: async (link) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch('/api/payment-links', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(link),
        })
        if (res.ok) {
          get().fetchPaymentLinks()
          get().addToast({ type: 'success', title: 'Payment Link Created' })
        }
      },
    }),
    { name: 'stealthpay-storage' }
  )
)
