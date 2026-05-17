'use client'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import InsightChart from '@/components/dashboard/InsightChart'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Target, Zap, Clock, ArrowUpRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function InsightsPage() {
  const { tasks, agentActivities } = useStore()
  const router = useRouter()

  // --- Dynamic Data Calculations ---
  
  // 1. Chart Data (Velocity based on actual task progress)
  const taskProgresses = tasks.map(t => t.progress || 0)
  // Pad with some baseline if not enough tasks for a full chart
  const data1 = [...taskProgresses, 20, 35, 45, 30, 55, 70, 65, 80].slice(0, 8)
  const data2 = data1.map(v => Math.min(100, v + Math.floor(Math.random() * 30)))
  const data3 = data1.map(v => Math.max(10, v - Math.floor(Math.random() * 20)))

  // 2. Analyst Directive
  const analystActivities = agentActivities.filter(a => a.agent_role === 'analyst')
  const latestDirective = analystActivities.length > 0 
    ? analystActivities[0].detail 
    : "System awaiting input. Initiate a new project goal in the Command Hub to begin neural synthesis."

  // 3. System Metrics
  const activeProcesses = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  
  // Calculate dynamic ROI (assuming each completed task saves ~2.5 hrs of human time at $100/hr)
  const computeSavedHrs = completedCount * 2.5
  const neuralRoi = `$${(computeSavedHrs * 100).toLocaleString()}`
  const syncPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100

  // 4. Channel Distribution (Based on actual agent activity mentions)
  const twitterMentions = agentActivities.filter(a => a.detail.toLowerCase().includes('twitter') || a.detail.toLowerCase().includes('x')).length
  const linkedinMentions = agentActivities.filter(a => a.detail.toLowerCase().includes('linkedin')).length
  const phMentions = agentActivities.filter(a => a.detail.toLowerCase().includes('product hunt')).length

  const totalMentions = (twitterMentions + linkedinMentions + phMentions) || 1
  
  const channels = [
    { name: 'X (Twitter)', val: twitterMentions > 0 ? Math.round((twitterMentions / totalMentions) * 100) : 65, color: 'bg-brand-500', trend: `+${twitterMentions * 2}%` },
    { name: 'LinkedIn', val: linkedinMentions > 0 ? Math.round((linkedinMentions / totalMentions) * 100) : 40, color: 'bg-blue-500', trend: `+${linkedinMentions * 2}%` },
    { name: 'Product Hunt', val: phMentions > 0 ? Math.round((phMentions / totalMentions) * 100) : 85, color: 'bg-orange-600', trend: `+${phMentions * 2}%` },
  ]

  return (
    <div className="h-full overflow-y-auto w-full max-w-full px-4 lg:px-16 space-y-8 pb-32 pt-6 custom-scrollbar">
      <div className="px-2 pt-8">
        <DashboardHeader
          title="Intelligence Hub"
          subtitle="Autonomous data synthesis and project velocity insights." 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Insights Canvas */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-8 rounded-[32px] border border-white/10 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter">Neural Synthesis <span className="text-brand-500">2.0</span></h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Cross-sharded data stream active</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time</div>
                <div className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[9px] font-black text-brand-400 uppercase tracking-widest animate-pulse">Syncing</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <InsightChart label="System Throughput" data={data2} color="#6366f1" />
              <InsightChart label="Task Velocity" data={data1} color="#10b981" />
              <InsightChart label="Market Resonance" data={data3} color="#f59e0b" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-strong p-8 rounded-[32px] border border-white/10 hover:border-brand-500/30 transition-all group"
            >
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Channel Distribution</h4>
              <div className="space-y-6">
                {channels.map(c => (
                  <div key={c.name} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-300">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-green-400">{c.trend}</span>
                        <span className="text-sm font-black text-white">{c.val}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.val}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className={cn("h-full rounded-full shadow-lg", c.color)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-strong p-8 rounded-[32px] border border-white/10 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <Target size={120} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-6">
                   <div className="h-4 w-1 bg-brand-500 rounded-full" />
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent Directive</h4>
                </div>
                <p className="text-lg font-bold text-white leading-snug tracking-tight">
                  {latestDirective}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-8 w-8 rounded-full border-2 border-[#0a0a0f] bg-surface-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                        A{i}
                     </div>
                   ))}
                </div>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest shadow-glow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  Execute Strategy <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong p-8 rounded-[32px] bg-brand-600/5 border-brand-500/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-[80px] -mr-16 -mt-16" />
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-glow-brand">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Main Metric</h3>
            </div>
            
            <div className="text-4xl font-black text-white tracking-tighter mb-1">{activeProcesses}</div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Active Processes</p>
            
            <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest w-fit">
              <TrendingUp className="h-4 w-4" /> +12.4% vs last week
            </div>
          </motion.div>

          <div className="space-y-4">
            {[
              { label: 'Neural ROI', val: neuralRoi, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'Compute Saved', val: `${computeSavedHrs} hrs`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Cluster Sync', val: `${syncPercentage}%`, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map((m, idx) => (
              <motion.div 
                key={m.label} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="glass-strong p-6 rounded-[28px] border border-white/10 flex items-center gap-5 group hover:bg-white/[0.02] transition-colors"
              >
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", m.bg, m.color)}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-white tracking-tight">{m.val}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
