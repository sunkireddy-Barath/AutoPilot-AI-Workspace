'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useStore } from '@/lib/store'
import { Zap, Mail, Lock, Chrome } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const router = useRouter()
  const setUserId = useStore((s) => s.setUserId)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    const loginToast = toast.loading('Connecting to Google Workspace...')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      if (user) {
        setUserId(user.uid)
        toast.success(`🚀 Welcome back, ${user.displayName || 'Operator'}!`, { id: loginToast })
        router.replace('/dashboard')
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      toast.error(err.message || 'Google Sign-In failed', { id: loginToast })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (userCredential.user) {
          setUserId(userCredential.user.uid)
          toast.success('✨ Account created successfully!')
          router.replace('/dashboard')
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        if (userCredential.user) {
          setUserId(userCredential.user.uid)
          toast.success('🚀 Welcome back!')
          router.replace('/dashboard')
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 bg-mesh-gradient">
      {/* Background glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-glow-brand mb-4">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">AutoPilot</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Your AI-powered business automation system
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong p-8">
          {/* Mode tabs */}
          <div className="flex bg-surface-800 rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${mode === m
                    ? 'bg-brand-600 text-white shadow-glow-brand'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 h-11"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? '🚀 Sign In' : '✨ Create Account'
              )}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0f] px-2 text-slate-500 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full h-11 glass hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all active:scale-95"
            whileTap={{ scale: 0.98 }}
          >
            <Chrome className="h-5 w-5 text-brand-400" />
            Google Workspace
          </motion.button>

          {mode === 'login' && (
            <p className="text-center text-xs text-slate-500 mt-4">
              No account?{' '}
              <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 underline">
                Sign up free
              </button>
            </p>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '🎯', label: '4 AI Agents' },
            { icon: '⚡', label: 'Real-time' },
            { icon: '🔮', label: 'LangGraph' },
          ].map((f) => (
            <div key={f.label} className="glass p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs text-slate-400">{f.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
