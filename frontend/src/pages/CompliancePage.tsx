import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Key, Hash, Search, CheckCircle, AlertCircle, Loader2, Lock, Eye } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, truncateAddress, randomHex } from '../lib/utils'
import type { DecryptedTransaction } from '../types'

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

  const fillDemo = () => {
    setTxHash(`0x${randomHex(64)}`)
    setViewingKey(`vk_${randomHex(48)}`)
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
            <button type="button" onClick={fillDemo} className="btn-ghost text-xs flex-1 justify-center">
              <Eye className="w-3.5 h-3.5" /> Fill Demo Data
            </button>
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
  return (
    <AppLayout pageTitle="Compliance & Viewing Keys" pageSubtitle="Selective disclosure for regulatory compliance via Umbra">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DecryptForm />
          <div className="space-y-4">
            <HowItWorksPanel />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="glass-card p-5"
              style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Compliance Notice</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Viewing keys provide selective transparency while maintaining on-chain privacy.
                All transaction data is encrypted by Umbra Protocol on Solana.
                Only authorized parties with valid viewing keys can decrypt transaction details.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
