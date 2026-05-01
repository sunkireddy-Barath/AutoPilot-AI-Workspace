import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Lock, Copy, Check, X, Loader2, ChevronRight } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount } from '../lib/utils'
import type { Invoice } from '../types'

const STATUS_STYLES: Record<Invoice['status'], string> = {
  paid: 'badge-success',
  pending: 'badge-warning',
  overdue: 'badge-danger',
  draft: 'text-zinc-500 bg-zinc-500/10 border border-zinc-500/20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const { addInvoice, addToast } = useAppStore()
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', amount: '',
    currency: 'USDC', description: '', status: 'pending' as Invoice['status'],
    dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientName || !form.amount || !form.description) {
      addToast({ type: 'error', title: 'Missing Fields' })
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    addInvoice({ ...form, amount: Number(form.amount) })
    setLoading(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Create Invoice</h2>
            <p className="text-xs text-zinc-500">Private payment link generated automatically</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Client Name *</label>
              <input className="input-field" placeholder="TechVentures Inc." value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Client Email</label>
              <input type="email" className="input-field" placeholder="billing@client.com" value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Description *</label>
            <textarea className="input-field min-h-16 resize-none" placeholder="Service description..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1 block">Amount *</label>
              <input type="number" className="input-field" placeholder="10000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
              <select className="input-field" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option>USDC</option><option>SOL</option><option>USDT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Due Date</label>
            <input type="date" className="input-field" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Invoice'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function InvoiceRow({ inv, onClick }: { inv: Invoice, onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="glass-card-hover p-4 flex items-center gap-4 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <FileText className="w-5 h-5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{inv.clientName}</span>
          <span className="text-xs text-zinc-500 font-mono">{inv.invoiceNumber}</span>
        </div>
        <div className="text-xs text-zinc-500 truncate">{inv.description}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-white">{formatAmount(inv.amount)}</div>
        <div className="text-xs text-zinc-500">Due {new Date(inv.dueDate).toLocaleDateString()}</div>
      </div>
      <span className={STATUS_STYLES[inv.status]}>{inv.status}</span>
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
    </motion.div>
  )
}

function InvoiceDrawer({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const { updateInvoiceStatus } = useAppStore()
  const copy = () => {
    navigator.clipboard.writeText(invoice.paymentLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm h-full overflow-y-auto p-6 space-y-5"
        style={{ background: '#0f0f1a', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500">{invoice.invoiceNumber}</div>
            <h2 className="text-lg font-bold text-white">{invoice.clientName}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-xs text-zinc-500 mb-1">Amount</div>
          <div className="text-3xl font-bold gradient-text">{formatAmount(invoice.amount)}</div>
          <div className="mt-2"><span className={STATUS_STYLES[invoice.status]}>{invoice.status}</span></div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Description', value: invoice.description },
            { label: 'Due Date', value: new Date(invoice.dueDate).toLocaleDateString() },
          ].map(item => (
            <div key={item.label} className="flex justify-between">
              <span className="text-xs text-zinc-500">{item.label}</span>
              <span className="text-xs text-white text-right max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-2">Private Payment Link</div>
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-xs font-mono text-violet-300 flex-1 truncate">{invoice.paymentLink}</span>
            <button onClick={copy} className="p-1.5 rounded-lg hover:bg-violet-500/20 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
            </button>
          </div>
        </div>
        {invoice.status === 'pending' && (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { updateInvoiceStatus(invoice.id, 'paid'); onClose() }}
            className="btn-primary w-full justify-center">
            <Check className="w-4 h-4" /> Mark as Paid
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function InvoicesPage() {
  const { invoices, fetchInvoices } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [filter, setFilter] = useState<Invoice['status'] | 'all'>('all')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const filtered = filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter)

  return (
    <AppLayout pageTitle="Invoices & Billing" pageSubtitle="Private invoice management with confidential payments">
      <div className="space-y-5 w-full">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: invoices.length, color: '#7c3aed' },
            { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, color: '#f59e0b' },
            { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#10b981' },
            { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#ef4444' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }} className="glass-card p-4">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label} Invoices</div>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['all', 'pending', 'paid', 'overdue', 'draft'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${filter === f ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Create Invoice
          </motion.button>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(inv => (
              <InvoiceRow key={inv.id} inv={inv} onClick={() => setSelected(inv)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} />}
        {selected && <InvoiceDrawer invoice={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </AppLayout>
  )
}
