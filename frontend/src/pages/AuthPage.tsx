import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Shield, ArrowRight, Loader2, Info } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAppStore } from '../store'

export default function AuthPage() {
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { authenticateWallet, addToast } = useAppStore()
  const [loading, setLoading] = useState(false)

  // Handle wallet-based authentication with the backend
  useEffect(() => {
    if (connected && publicKey) {
      authenticateWallet(publicKey.toBase58())
    }
  }, [connected, publicKey, authenticateWallet])

  const handleEnter = () => {
    if (!connected) {
      addToast({ type: 'error', title: 'Wallet Required', message: 'Please connect your Solana wallet first' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      navigate('/dashboard')
      setLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center glow-violet"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white tracking-tight text-glow">StealthPay</div>
          <div className="text-sm text-violet-400 font-medium">Private Finance OS</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-10 text-center relative z-20"
      >
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Identity via Wallet</h2>
          <p className="text-zinc-400 text-sm leading-relaxed px-4">
            Encrypted business finance on Solana. Your wallet is your secure, private identity.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <WalletMultiButton className="!w-full !bg-zinc-900/90 hover:!bg-black !border !border-white/10 !rounded-xl !h-14 !px-6 !text-sm !font-bold !transition-all !relative shadow-xl" />
            </div>
            
            <AnimatePresence>
              {connected && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Authenticated</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleEnter}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg
              ${connected 
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 active:scale-[0.98]' 
                : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
              }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Enter Private Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {!connected && (
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 text-left">
            <Info className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Connect your wallet to synchronize your encrypted financial data with the StealthPay backend.
            </p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-help" title="Powered by Umbra Protocol">
            <Lock className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-help" title="Selective Disclosure via Viewing Keys">
            <Shield className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Private</span>
          </div>
        </div>
      </motion.div>

      <div className="mt-12 flex items-center gap-6 opacity-20">
        <span className="text-[9px] text-white uppercase tracking-[0.4em] font-bold">Privacy Layer</span>
        <div className="w-1 h-1 rounded-full bg-white" />
        <span className="text-[9px] text-white uppercase tracking-[0.4em] font-bold">Blockchain Verified</span>
      </div>
    </div>
  )
}
