'use client'

import { useStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowUpRight, Zap, Shield, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NeuralSuggestions() {
  const { tasks, agentActivities } = useStore()
  
  // Generate dynamic suggestions based on real state
  const getDynamicSuggestions = () => {
    const items = []
    
    const blockedCount = tasks.filter(t => t.status === 'blocked').length
    const completedCount = tasks.filter(t => t.status === 'completed').length
    const mktCount = agentActivities.filter(a => a.agent_role === 'marketing').length
    const devCount = agentActivities.filter(a => a.agent_role === 'developer').length

    if (blockedCount > 0) {
      items.push({
        id: 'dyn-1',
        title: 'Bypass Neural Bottleneck',
        desc: `Detected ${blockedCount} blocked clusters. Recommended: Re-route via secondary logic shards.`,
        impact: 'Critical',
        icon: Shield,
        color: 'text-red-400',
        bg: 'bg-red-400/10'
      })
    }

    if (mktCount > 5) {
      items.push({
        id: 'dyn-2',
        title: 'Audience Expansion Pulse',
        desc: 'Marketing throughput high. AI recommends activating the "Global Resonance" plugin.',
        impact: 'High',
        icon: Target,
        color: 'text-brand-400',
        bg: 'bg-brand-400/10'
      })
    }

    if (completedCount > 2 && devCount > 3) {
      items.push({
        id: 'dyn-3',
        title: 'Code Refactor Cycle',
        desc: 'Development milestone reached. Suggested: Autonomous linting and optimization pass.',
        impact: 'Medium',
        icon: Zap,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10'
      })
    }

    // Fallback if no specific triggers
    if (items.length < 2) {
      items.push({
        id: 'dyn-default',
        title: 'Neural Sync Optimization',
        desc: 'All systems stable. AI suggests a preemptive cache purge for 12% faster response.',
        impact: 'Low',
        icon: Sparkles,
        color: 'text-indigo-400',
        bg: 'bg-indigo-400/10'
      })
    }

    return items.slice(0, 3)
  }

  const suggestions = getDynamicSuggestions()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
            <Sparkles className="h-4 w-4" />
          </div>
          Neural Suggestions
        </h3>
        <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-400 uppercase tracking-widest animate-pulse">
          Live Analysis
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110 duration-500", s.bg, s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", s.color)}>
                    {s.impact} Impact
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                  {s.desc}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-brand-400 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="mt-auto w-full py-3 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-brand-500/20 hover:text-brand-400 transition-all">
        Synthesize All Recommendations
      </button>
    </div>
  )
}
