'use client'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Bell,
  Save,
  User,
  Mail,
  Lock,
  Globe,
  ChevronRight,
  Palette,
  Sun,
  Moon,
  Monitor,
  Activity,
  Users,
  Cloud,
  Database,
  Key,
  Shield
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { auth } from '@/lib/firebase'
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('neural')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settings, setSettings] = useState({
    thoughtStream: true,
    audioFeedback: false,
    successHUD: true,
  })
  const [loading, setLoading] = useState(false)

  // Load real user data from Firebase on mount
  useEffect(() => {
    if (auth?.currentUser) {
      setEmail(auth.currentUser.email || '')
      setName(auth.currentUser.displayName || '')
    }
  }, [])

  const handleUpdateProfile = async () => {
    if (!auth?.currentUser) {
      toast.error('Not signed in.')
      return
    }
    setLoading(true)
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      toast.success('Profile updated!', { icon: '✨' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return toast.error('Enter a new password.')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.')
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.')
    if (!currentPassword) return toast.error('Enter your current password to verify.')

    if (!auth?.currentUser || !auth.currentUser.email) {
      toast.error('Not signed in with email/password.')
      return
    }

    setLoading(true)
    try {
      // Re-authenticate before password change (Firebase requirement)
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      toast.success('Password updated!', { icon: '🛡️' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect.')
      } else {
        toast.error(err.message || 'Failed to update password.')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    handleUpdateProfile()
  }

  return (
    <div className="h-full overflow-y-auto p-8 w-full max-w-full px-4 lg:px-16 space-y-8 pb-32">
      <DashboardHeader
        title="Personal Hub"
        subtitle="Manage your identity, security, and neural interface aesthetics."
      />

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Identity Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-strong p-8 rounded-[32px] border border-white/10 relative overflow-hidden group shadow-2xl flex flex-col items-center text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />

          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-[32px] bg-brand-600/10 border-2 border-brand-500/20 flex items-center justify-center relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-500 shadow-glow-brand/20">
              <User className="w-10 h-10 text-brand-400" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-600/20 to-transparent" />
            </div>
            <div className="absolute -inset-4 bg-brand-500/10 blur-2xl rounded-full opacity-50 animate-pulse" />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight mb-1">{name || 'Neural Operator'}</h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8">System Pilot</p>

          <div className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Email Address</label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-400 font-medium w-full truncate">{email || '—'}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Display Name</label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus-within:border-brand-500/40 transition-all">
                <User className="h-4 w-4 text-slate-500 shrink-0" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white font-medium w-full"
                  placeholder="Your display name"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-brand-600/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all disabled:opacity-50"
            >
              Update Profile
            </button>
          </div>
        </motion.div>

        {/* Security Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 glass-strong p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Security Cluster</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Lock className="h-3 w-3" /> Update Neural Key
              </h4>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-brand-500/40 outline-none text-xs text-white placeholder:text-slate-600 transition-all"
              />
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-brand-500/40 outline-none text-xs text-white placeholder:text-slate-600 transition-all"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-brand-500/40 outline-none text-xs text-white placeholder:text-slate-600 transition-all"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-brand-600/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Reset Security Key'}
              </button>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe className="h-3 w-3" /> Localization
              </h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Language</label>
                  <select className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white outline-none appearance-none">
                    <option>English (Neural Standard)</option>
                    <option>Spanish (LatAm)</option>
                    <option>German (Pro)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Timezone</label>
                  <select className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white outline-none appearance-none">
                    <option>UTC (Global Standard)</option>
                    <option>EST (Neural East)</option>
                    <option>PST (Neural West)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Visual Interface Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 glass-strong p-8 rounded-[32px] border border-white/10 relative overflow-hidden group shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Visual Matrix</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { id: 'dark', name: 'Obsidian', icon: Moon },
              { id: 'neural', name: 'Neural', icon: Activity },
              { id: 'light', name: 'Stellar', icon: Sun },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-500',
                  theme === t.id
                    ? 'bg-brand-600/10 border-brand-500 text-white shadow-glow-brand/20'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300'
                )}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Glassmorphism Intensity</span>
              <span className="text-[10px] font-black text-white">85%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-brand-500 shadow-glow-brand" />
            </div>
          </div>
        </motion.div>

        {/* Signals & HUD Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 glass-strong p-8 rounded-[32px] border border-white/10 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Signals & HUD</h3>
            </div>

            <div className="space-y-6">
              {[
                { id: 'thoughtStream', label: 'Neural Thought Stream', desc: 'Real-time visibility of agent reasoning.' },
                { id: 'audioFeedback', label: 'Audio Feedback', desc: 'Subtle sound cues for task completion.' },
                { id: 'successHUD', label: 'Success HUD', desc: 'Full-screen celebration on milestone reached.' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleSetting(item.id as keyof typeof settings)}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5 group-hover:text-brand-400 transition-colors">{item.label}</div>
                    <div className="text-[9px] text-slate-500 font-bold">{item.desc}</div>
                  </div>
                  <div className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-500 ease-in-out',
                    settings[item.id as keyof typeof settings] ? 'bg-brand-600 shadow-glow-brand/40' : 'bg-surface-800'
                  )}>
                    <span className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-500 ease-in-out',
                      settings[item.id as keyof typeof settings] ? 'translate-x-4' : 'translate-x-0'
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Interface v2.4.1</span>
            </div>
            <button className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
              Reset HUD <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </motion.div>

        {/* Team Cluster Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 glass-strong p-8 rounded-[32px] border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Team Cluster</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{name || 'Neural Operator'}</div>
                  <div className="text-[9px] text-brand-400 font-bold uppercase tracking-widest">Admin</div>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
            <User className="h-3 w-3" /> Add Cluster Member
          </button>
        </motion.div>

        {/* Integration Matrix Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3 glass-strong p-8 rounded-[32px] border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Integration Matrix</h3>
          </div>

          <div className="space-y-4">
            {[
              { id: 'firebase', name: 'Firebase Auth', status: 'Connected', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { id: 'backend', name: 'AI Backend API', status: 'Connected', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { id: 'stripe', name: 'Stripe Billing', status: 'Disconnected', icon: Database, color: 'text-slate-500', bg: 'bg-slate-800' },
            ].map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', integration.bg)}>
                    <integration.icon className={cn('h-4 w-4', integration.color)} />
                  </div>
                  <span className="text-xs font-bold text-white">{integration.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('h-1.5 w-1.5 rounded-full', integration.status === 'Connected' ? 'bg-emerald-500' : 'bg-slate-600')} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{integration.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end pt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={loading}
          className="px-10 py-4 rounded-2xl bg-brand-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-glow-brand flex items-center gap-3 group disabled:opacity-50"
        >
          <Save className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          Synchronize Hub
        </motion.button>
      </div>
    </div>
  )
}
