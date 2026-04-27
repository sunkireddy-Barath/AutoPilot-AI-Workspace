'use client'

import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#8B5CF6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#8B5CF6',
    lineColor: '#475569',
    secondaryColor: '#06B6D4',
    tertiaryColor: '#10B981'
  }
})

interface ArtifactRendererProps {
  type: 'roadmap' | 'architecture' | 'mermaid'
  data: any
}

export default function ArtifactRenderer({ type, data }: ArtifactRendererProps) {
  if (type === 'roadmap') {
    return <RoadmapRenderer phases={data.phases} />
  }
  
  if (type === 'mermaid' || type === 'architecture') {
    return <MermaidRenderer chart={data.chart || data} />
  }

  return null
}

function RoadmapRenderer({ phases }: { phases: any[] }) {
  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Roadmap</h4>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      
      <div className="grid gap-3">
        {phases.map((phase, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
          >
            <div className="flex-shrink-0 mt-1">
              {idx === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-brand-400" />
              ) : idx === 1 ? (
                <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-black text-brand-500 uppercase">Phase {phase.id || idx + 1}</span>
                <span className="text-[10px] font-bold text-slate-500">{phase.status || 'Planned'}</span>
              </div>
              <h5 className="text-sm font-bold text-white mb-1">{phase.title}</h5>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{phase.description}</p>
              
              {phase.milestones && phase.milestones.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {phase.milestones.map((m: string, mIdx: number) => (
                    <span key={mIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold uppercase tracking-tighter">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Connector Line */}
            {idx < phases.length - 1 && (
              <div className="absolute left-[26px] top-10 bottom-[-20px] w-px bg-gradient-to-b from-brand-500/50 to-transparent z-0" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MermaidRenderer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !chart) return
      
      try {
        const { svg } = await mermaid.render(id, chart)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p class="text-red-500 text-xs">Failed to render diagram. Check Mermaid syntax.</p>'
        }
      }
    }
    renderChart()
  }, [chart, id])

  return (
    <div className="my-6 p-6 rounded-2xl bg-surface-900/50 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_10px_#8B5CF6]" />
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Visual Blueprint</h4>
      </div>
      <div className="flex justify-center" ref={containerRef} />
    </div>
  )
}
