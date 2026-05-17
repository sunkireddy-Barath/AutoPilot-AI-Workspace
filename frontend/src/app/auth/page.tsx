'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useStore } from '@/lib/store'
import { Zap, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const router = useRouter()
  const setUserId = useStore((s) => s.setUserId)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!auth) {
      toast.error('Firebase not configured.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
        setUserId(cred.user.uid)
        toast.success('✨ Account created! Welcome to AutoPilot.')
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        setUserId(cred.user.uid)
        toast.success('🚀 Welcome back!')
      }
      router.replace('/dashboard')
    } catch (err: any) {
      console.error('[Auth error]', err?.code, err?.message)
      toast.error(firebaseErrorMessage(err?.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    if (!auth) {
      toast.error('Firebase not configured.')
      return
    }
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      setUserId(cred.user.uid)
      toast.success(`🚀 Welcome, ${cred.user.displayName || cred.user.email}!`)
      router.replace('/dashboard')
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // user cancelled — no toast
        return
      }
      console.error('[Google Auth error]', err?.code, err?.message)
      toast.error(firebaseErrorMessage(err?.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 bg-mesh-gradient">
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
          <p className="text-slate-400 mt-1 text-sm">Your AI-powered business automation system</p>
        </div>

        {/* Card */}
        <div className="glass-strong p-8">
          {/* Mode tabs */}
          <div className="flex bg-surface-800 rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === m ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google Sign-In */}
          <motion.button
            onClick={handleGoogle}
            disabled={loading}
            type="button"
            className="w-full h-11 glass hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all active:scale-95 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0f] px-2 text-slate-500 font-bold tracking-widest">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
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
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
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

          <p className="text-center text-xs text-slate-500 mt-5">
            {mode === 'login' ? (
              <>No account?{' '}
                <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 underline">
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 underline">
                  Sign in
                </button>
              </>
            )}
          </p>
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function firebaseErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found. Switch to Sign Up to create one.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'Email already registered. Switch to Sign In.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again in a few minutes.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and retry.'
    case 'auth/unauthorized-domain':
      return 'Domain not authorized in Firebase. Contact support.'
    case 'auth/popup-blocked':
      return 'Popup was blocked. Allow popups for this site and try again.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Enable it in Firebase Console.'
    default:
      return `Sign-in failed (${code ?? 'unknown'}). Please try again.`
  }
}
