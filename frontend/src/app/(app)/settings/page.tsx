'use client'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Bell, 
  Key, 
  Database,
  Eye,
  EyeOff,
  Save
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { autonomousMode, setAutonomousMode } = useStore()
  const [showKeys, setShowKeys] = useState(false)

  const handleSave = () => {
    toast.success('Configuration saved successfully')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <DashboardHeader 
        title="Settings" 
        subtitle="Configure your AI agent execution modes and API integrations." 
      />

      {/* Autonomous Mode Toggle */}
      <section className="glass-strong p-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Cpu className="w-32 h-32" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-12 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-400" />
              Autonomous Mode
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Allow agents to communicate and execute tasks without waiting for manual approval. 
              Ideal for high-velocity workflows.
            </p>
          </div>
          
          <button 
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autonomousMode ? 'bg-brand-600' : 'bg-surface-700'}`}
          >
            <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autonomousMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs font-bold text-brand-400 p-3 bg-brand-500/10 rounded-lg border border-brand-500/20">
          <ShieldCheck className="h-4 w-4" />
          SAFETY GUARD: ON (Agents cannot delete production database tables)
        </div>
      </section>

      {/* API Keys */}
      <section className="glass p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-400" />
            API Configurations
          </h3>
          <button 
            onClick={() => setShowKeys(!showKeys)}
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1"
          >
            {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showKeys ? 'HIDE' : 'SHOW'}
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">OpenAI API Key</label>
            <input 
              type={showKeys ? "text" : "password"} 
              className="input-dark font-mono text-sm" 
              defaultValue="sk-proj-................................................."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Supabase Service Role</label>
            <input 
              type={showKeys ? "text" : "password"} 
              className="input-dark font-mono text-sm" 
              defaultValue="sb-secret-.............................................."
            />
          </div>
        </div>
      </section>

      {/* Notifications & System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="glass p-8">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-400" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Agent Thinking Alerts', enabled: true },
              { label: 'Task Completion', enabled: true },
              { label: 'Workflow Milestone', enabled: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                <div className={`h-4 w-8 rounded-full ${item.enabled ? 'bg-brand-500' : 'bg-surface-800'} relative`}>
                  <div className={`absolute top-0.5 ${item.enabled ? 'right-0.5' : 'left-0.5'} h-3 w-3 rounded-full bg-white`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass p-8">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-400" />
            Persistence
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Total storage used: <span className="text-white font-bold">1.2GB</span> / 5.0GB
          </p>
          <button className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
            Flush Local Cache
          </button>
        </section>
      </div>

      <div className="flex justify-end mt-4">
        <button 
          onClick={handleSave}
          className="btn-primary flex items-center gap-2 px-8 py-3"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
