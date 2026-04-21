'use client'

import { motion } from 'framer-motion'
import { useStore, AgentRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Activity, Shield, Brain, Cpu, Megaphone, BarChart, Server } from 'lucide-react'

const agentMeta: Record<AgentRole, { icon: any, desc: string, color: string, capabilities: string[] }> = {
  product_manager: {
    icon: Brain,
    desc: 'Analyzes user goals and breaks them into high-level features and RICE-prioritized tasks.',
    color: '#8B5CF6',
    capabilities: ['Strategic Planning', 'Feature Scoping', 'RICE Scoring']
  },
  developer: {
    icon: CodeIcon,
    desc: 'Converts features into technical architecture, code skeletons, and implementation steps.',
    color: '#06B6D4',
    capabilities: ['Architecture Design', 'Full-stack Logic', 'Tech Stack Selection']
  },
  marketing: {
    icon: Megaphone,
    desc: 'Creates GTM strategies, content calendars, and multi-channel campaign plans.',
    color: '#F59E0B',
    capabilities: ['GTM Strategy', 'Content Generation', 'Channel Discovery']
  },
  analyst: {
    icon: BarChart,
    desc: 'Monitors progress, tracks metrics, and provides data-driven optimizations for the workflow.',
    color: '#10B981',
    capabilities: ['Metric Tracking', 'Data Insights', 'Performance Tuning']
  },
  orchestrator: {
    icon: Cpu,
    desc: 'Master AI that coordinates between agents and maintains global state and memory.',
    color: '#6366f1',
    capabilities: ['State Management', 'Conflict Resolution', 'Global Orchestration']
  }
}

function CodeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  )
}

export default function AgentGrid() {
  const { agentStatuses } = useStore()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {(Object.entries(agentMeta) as [AgentRole, typeof agentMeta['developer']][]).map(([role, meta], i) => {
        const status = agentStatuses[role] || 'idle'
        const Icon = meta.icon

        return (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-strong p-6 flex flex-col group relative overflow-hidden"
          >
            {/* Live Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 rounded bg-surface-800 border border-white/5">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === 'thinking' ? "bg-yellow-400 animate-pulse" :
                status === 'active' ? "bg-green-400" : "bg-slate-500"
              )} />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{status}</span>
            </div>

            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] mb-6">{meta.desc}</p>

            <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {meta.capabilities.map(cap => (
                  <span key={cap} className="px-2 py-1 rounded-md bg-surface-700 text-slate-300">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">instance: p3.turbo</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span className="text-[10px] text-green-500 font-bold">SECURE</span>
              </div>
            </div>

            {/* Decorative mesh */}
            <div 
              className="absolute -bottom-12 -right-12 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{ backgroundColor: meta.color }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
