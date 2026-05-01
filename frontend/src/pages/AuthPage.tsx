import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Eye, EyeOff, Mail, Building2, Loader2, Shield, ArrowRight, Wallet as WalletIcon, Terminal } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAppStore } from '../store'

export default function AuthPage() {
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { login, signup, addToast } = useAppStore()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', company: '' })

  useEffect(() => {
    if (connected && publicKey && tab === 'signup') {
      // Prompt for company info if signup and wallet just connected
    }
  }, [connected, publicKey, tab])

  const handleEnter = async () => {
    if (!connected && !devMode) {
      addToast({ type: 'error', title: 'Wallet Required', message: 'Please connect your Solana wallet to continue' })
      return
    }

    setLoading(true)
    const walletAddr = devMode ? 'DEV_WALLET_ADDRESS' : publicKey?.toBase58() || ''
    
    if (tab === 'signup') {
      if (!form.company) {
        addToast({ type: 'error', title: 'Missing Information', message: 'Please provide your company name' })
        setLoading(false)
        return
      }
      const ok = await signup(form.email, form.password, form.company, walletAddr)
      if (ok) {
        addToast({ type: 'success', title: 'Account Created', message: 'Welcome to StealthPay' })
        navigate('/dashboard')
      } else {
        addToast({ type: 'error', title: 'Signup Failed', message: 'Email may already be registered' })
      }
    } else {
      const ok = await login(form.email, form.password)
      if (ok) {
        addToast({ type: 'success', title: 'Welcome Back', message: 'Private finance OS ready' })
        navigate('/dashboard')
      } else {
        addToast({ type: 'error', title: 'Login Failed', message: 'Invalid credentials' })
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>


      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow-violet"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xl font-bold text-white">StealthPay</div>
          <div className="text-xs text-violet-400">Private Business Finance OS</div>
          
          <button
            onClick={() => {
              const newMode = !devMode
              setDevMode(newMode)
              addToast({ 
                type: 'info', 
                title: newMode ? 'Dev Mode Enabled' : 'Dev Mode Disabled',
                message: newMode ? 'Wallet bypass active' : 'Wallet connection required'
              })
            }}
            className={`mt-2 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
              devMode 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-white/5 border-white/10 text-zinc-600 hover:border-white/20'
            }`}
          >
            <Terminal className="w-2.5 h-2.5" />
            {devMode ? 'Dev Mode: ON' : 'Dev Mode: OFF (Click to Bypass)'}
          </button>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="flex p-1 bg-white/5 rounded-xl mb-8">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all
                ${tab === t ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {tab === 'login' ? 'Welcome Back' : 'Create Business Account'}
          </h2>
          <p className="text-sm text-zinc-500">
            {tab === 'login' 
              ? 'Connect your wallet and sign in to access your private dashboard.' 
              : 'Join the next generation of private business finance on Solana.'}
          </p>
        </div>

        {!devMode && (
          <div className="flex justify-center mb-8">
            <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-700 !rounded-xl !h-12 !px-8 !font-semibold !transition-all" />
          </div>
        )}

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#08080F] px-2 text-zinc-500">Credentials</span></div>
        </div>

        <div className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" className="input-field pl-9" placeholder="Acme Corp"
                  value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" className="input-field pl-9" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type={showPass ? 'text' : 'password'} className="input-field pl-9 pr-10" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            onClick={handleEnter}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-sm mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {tab === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>

        {/* Features */}
        <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
          {[
            { icon: Lock, text: 'All payments encrypted via Umbra Protocol' },
            { icon: Shield, text: 'Zero on-chain exposure for business finances' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-xs text-zinc-500">
              <item.icon className="w-3 h-3 text-violet-400 flex-shrink-0" />
              {item.text}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-zinc-600 mt-6 text-center"
      >
        Powered by Umbra Protocol on Solana • Privacy by default
      </motion.p>
    </div>
  )
}
