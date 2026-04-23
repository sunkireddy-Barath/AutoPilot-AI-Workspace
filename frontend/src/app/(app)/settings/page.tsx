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
  Activity
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [email, setEmail] = useState('neural.pilot@autopilot.ai')
  const [name, setName] = useState('Neural Pilot')
  const [theme, setTheme] = useState('neural')
  const [settings, setSettings] = useState({
    thoughtStream: true,
    audioFeedback: false,
    successHUD: true
  })

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    toast.success('Preferences synchronized', {
      icon: '✨',
      style: { borderRadius: '16px', background: '#0a0a14', color: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)' }
    })
  }

  return (
    <div className="p-8 w-full max-w-full px-4 lg:px-16 space-y-8 pb-32">
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

          <h3 className="text-xl font-black text-white tracking-tight mb-1">{name}</h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8">System Pilot</p>

          <div className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Email Address</label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus-within:border-brand-500/40 transition-all">
                <Mail className="h-4 w-4 text-slate-500" />
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white font-medium w-full"
                />
              </div>
            </div>
            
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Display Name</label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus-within:border-brand-500/40 transition-all">
                <User className="h-4 w-4 text-slate-500" />
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white font-medium w-full"
                />
              </div>
            </div>
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
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Update Neural Key
                </h4>
                <div className="space-y-3">
                  <input type="password" placeholder="Current encryption key" className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-brand-500/40 outline-none text-xs text-white placeholder:text-slate-600 transition-all" />
                  <input type="password" placeholder="New neural key" className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-brand-500/40 outline-none text-xs text-white placeholder:text-slate-600 transition-all" />
                  <button className="w-full py-3 rounded-2xl bg-brand-600/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all">
                    Reset Security Key
                  </button>
                </div>
              </div>
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
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-500",
                  theme === t.id ? "bg-brand-600/10 border-brand-500 text-white shadow-glow-brand/20" : "bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300"
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

        {/* System Interaction Module */}
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
              ].map(item => (
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
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-500 ease-in-out focus:outline-none",
                    settings[item.id as keyof typeof settings] ? "bg-brand-600 shadow-glow-brand/40" : "bg-surface-800"
                  )}>
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-500 ease-in-out",
                      settings[item.id as keyof typeof settings] ? "translate-x-4" : "translate-x-0"
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
      </div>

      <div className="flex justify-end pt-8">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="px-10 py-4 rounded-2xl bg-brand-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-glow-brand flex items-center gap-3 group"
        >
          <Save className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          Synchronize Hub
        </motion.button>
      </div>
    </div>
  )
}
