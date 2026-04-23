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
  },
  operations: {
    icon: Server,
    desc: 'Handles infrastructure orchestration, CI/CD pipelines, and multi-cloud deployment scaling.',
    color: '#EC4899',
    capabilities: ['Cloud Orchestration', 'CI/CD Pipelines', 'System Scalability']
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {(Object.entries(agentMeta) as [AgentRole, typeof agentMeta['developer']][]).map(([role, meta], i) => {
        const status = agentStatuses[role] || 'idle'
        const Icon = meta.icon

        return (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative"
          >
            {/* Hover Glow */}
            <div 
              className="absolute -inset-0.5 rounded-[24px] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
              style={{ backgroundColor: meta.color }}
            />

            <div className="relative h-full glass-strong p-6 rounded-[24px] border border-white/10 flex flex-col overflow-hidden bg-[#111118]/60 backdrop-blur-3xl">
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-1/2 w-full -translate-y-full group-hover:animate-[shimmer_3s_infinite]" />
              
              <div className="flex items-start justify-between mb-8">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg"
                  style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors",
                    status === 'thinking' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse" :
                    status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-slate-500 border-white/5"
                  )}>
                    <div className={cn(
                      "h-1 w-1 rounded-full",
                      status === 'thinking' ? "bg-yellow-400" :
                      status === 'active' ? "bg-green-400 shadow-glow-brand" : "bg-slate-500"
                    )} />
                    {status}
                  </div>
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">ID: AG-00{i+1}</div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                  {meta.desc}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Matrix</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.capabilities.map(cap => (
                      <span key={cap} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-bold text-slate-300 hover:border-white/10 transition-colors">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-60">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider tabular-nums">p3.turbo.xl</span>
                </div>
                <div className="p-1 rounded-lg bg-green-500/10">
                   <Shield className="h-3 w-3 text-green-500" />
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
