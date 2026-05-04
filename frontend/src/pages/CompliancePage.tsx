import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Key, Hash, Search, CheckCircle, AlertCircle, Loader2, Lock, Eye } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, truncateAddress, randomHex, formatRelativeTime } from '../lib/utils'

interface DecryptedTransaction {
  tx_hash: string
  sender: string
  receiver: string
  amount: number
  currency: string
  type: string
  memo: string
  timestamp: string
}

function DecryptForm() {
  const { decryptTransaction, addToast } = useAppStore()
  const [txHash, setTxHash] = useState('')
  const [viewingKey, setViewingKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecryptedTransaction | null>(null)
  const [error, setError] = useState('')

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txHash || !viewingKey) {
      setError('Both TX Hash and Viewing Key are required')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)
    
    try {
      const res = await decryptTransaction(txHash, viewingKey)
      const data = await res.json()
      
      if (res.ok) {
        setResult(data.decrypted_data)
        addToast({ type: 'success', title: 'Transaction Decrypted', message: 'Viewing key accepted by Umbra Protocol' })
      } else {
        setError(data.error || 'Invalid viewing key. Transaction could not be decrypted.')
        addToast({ type: 'error', title: 'Decryption Failed', message: 'Invalid or expired viewing key' })
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }




  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Key className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Decrypt Transaction</h3>
            <p className="text-xs text-zinc-500">Use your viewing key to reveal encrypted transaction details</p>
          </div>
        </div>

        <form onSubmit={handleDecrypt} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">
              <Hash className="w-3 h-3 inline mr-1" />
              Transaction Hash
            </label>
            <input
              className="input-field font-mono text-xs"
              placeholder="0x1a2b3c4d5e6f..."
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">
              <Key className="w-3 h-3 inline mr-1" />
              Viewing Key (from Umbra)
            </label>
            <input
              className="input-field font-mono text-xs"
              placeholder="vk_abc123..."
              value={viewingKey}
              onChange={e => setViewingKey(e.target.value)}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-red-400">{error}</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
              className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Decrypting...' : 'Decrypt'}
            </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5"
            style={{ borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Transaction Decrypted</div>
                <div className="text-xs text-emerald-400">Viewing key verified by Umbra Protocol</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Amount', value: formatAmount(result.amount), highlight: true },
                { label: 'Currency', value: result.currency },
                { label: 'Type', value: result.type, cap: true },
                { label: 'Sender', value: truncateAddress(result.sender, 8), mono: true },
                { label: 'Receiver', value: truncateAddress(result.receiver, 8), mono: true },
                { label: 'Timestamp', value: new Date(result.timestamp).toLocaleString() },
                { label: 'Memo', value: result.memo ?? '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span className={`text-xs font-medium text-right max-w-[60%]
                    ${item.highlight ? 'text-emerald-400 font-bold text-sm' : ''}
                    ${item.mono ? 'font-mono text-violet-300' : 'text-white'}
                    ${item.cap ? 'capitalize' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="flex items-center gap-2 text-violet-300">
                <Lock className="w-3 h-3" />
                <span>This transaction is still encrypted on-chain. Only the viewing key holder can see these details.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HowItWorksPanel() {
  const steps = [
    { n: '01', title: 'Send Private Transaction', desc: 'Any payment via StealthPay is encrypted using Umbra Protocol before hitting Solana chain.' },
    { n: '02', title: 'Receive Viewing Key', desc: 'Umbra issues a unique viewing key that can decrypt transaction details for compliance.' },
    { n: '03', title: 'Selective Disclosure', desc: 'Share your viewing key only with auditors or regulators. On-chain data remains encrypted.' },
    { n: '04', title: 'Decrypt on Demand', desc: 'Use this tool to reveal transaction details using the viewing key at any time.' },
  ]
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">How Viewing Keys Work</h3>
      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div key={s.n} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }} className="flex gap-3">
            <div className="text-xs font-bold text-violet-400 font-mono w-6 flex-shrink-0 mt-0.5">{s.n}</div>
            <div>
              <div className="text-xs font-semibold text-white mb-0.5">{s.title}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{s.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function CompliancePage() {
  const { transactions } = useAppStore()
  const transactionsList = transactions || []
  
  const auditLogs = transactionsList.slice(0, 5).map(tx => ({
    id: tx.id,
    action: 'Encryption Verified',
    target: truncateAddress(tx.txHash, 6),
    time: formatRelativeTime(tx.timestamp),
    status: 'success'
  }))


  return (
    <AppLayout pageTitle="Compliance & Security" pageSubtitle="Selective disclosure and regulatory tools via Umbra Protocol">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 w-full">
        {/* Left Column: Privacy Metrics (3/12) */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 relative overflow-hidden flex flex-col items-center text-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(15,15,25,0.8))', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at center, #10b981, transparent 70%)' }} />
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow" />
                <span className="text-3xl font-black text-white">98</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Privacy Score</h3>
              <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">Excellent</p>
            </div>
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Encryption</span>
                <span className="text-emerald-400">100%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </motion.div>

          <HowItWorksPanel />
        </div>

        {/* Center Column: Decrypt Terminal (5/12) */}
        <div className="lg:col-span-5">
          <DecryptForm />
        </div>

        {/* Right Column: Audit Logs & Notices (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h3>
              <ShieldCheck className="w-4 h-4 text-violet-400" />
            </div>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shadow-[0_0_8px] ${log.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50'}`} />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">{log.action}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] font-mono text-zinc-500">{log.target}</span>
                      <span className="text-[10px] text-zinc-600 font-medium">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 rounded-xl text-[10px] font-bold text-zinc-500 border border-white/5 hover:bg-white/5 uppercase tracking-widest transition-all">
              View Full Audit Log
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
            style={{ borderLeft: '4px solid #f59e0b' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Compliance Notice</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Viewing keys provide selective transparency while maintaining on-chain privacy. 
              All transaction data is encrypted by Umbra Protocol on Solana. 
              Only authorized parties with valid viewing keys can decrypt details.
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
