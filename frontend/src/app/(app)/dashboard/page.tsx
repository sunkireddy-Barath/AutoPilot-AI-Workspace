'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { tasksApi, agentsApi } from '@/lib/api'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import TaskItem from '@/components/dashboard/TaskItem'
import AgentActivityTimeline from '@/components/dashboard/AgentActivityTimeline'
import Link from 'next/link'
import InteractiveCard from '@/components/ui/InteractiveCard'
import { cn } from '@/lib/utils'

import FileExplorer from '@/components/dashboard/FileExplorer'

export default function DashboardPage() {
  const { userId, tasks, setTasks, agentActivities, setAgentActivities } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      try {
        const [tasksData, activitiesData] = await Promise.all([
          tasksApi.list(userId),
          agentsApi.getActivities()
        ])
        setTasks(tasksData as any[])
        setAgentActivities(activitiesData as any[])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, setTasks, setAgentActivities])

  // --- Dynamic Calculations ---
  const totalTasks = tasks.length || 1
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length
  
  const systemHealth = Math.round((completedTasks / totalTasks) * 100)
  const displayHealth = tasks.length === 0 ? 100 : systemHealth
  
  const efficiency = 100 - Math.round((blockedTasks / totalTasks) * 100)
  const displayEfficiency = tasks.length === 0 ? 100 : efficiency

  const stats = [
    { 
      label: 'Active Tasks', 
      value: tasks.filter(t => t.status !== 'completed').length, 
      icon: Clock, 
      color: '#6366f1' 
    },
    { 
      label: 'Completed', 
      value: tasks.filter(t => t.status === 'completed').length, 
      icon: CheckCircle2, 
      color: '#10b981' 
    },
    { 
      label: 'System Health', 
      value: `${displayHealth}%`, 
      icon: Activity, 
      color: '#06b6d4' 
    },
    { 
      label: 'Risks Noted', 
      value: tasks.filter(t => t.status === 'blocked').length, 
      icon: AlertTriangle, 
      color: '#f59e0b' 
    },
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="p-8 w-full max-w-full px-4 lg:px-16 space-y-8 pb-32">
      <DashboardHeader 
        title="Command Hub" 
        subtitle="Intelligent orchestration of your active AI clusters." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Top Feature Card - Strategic Overview */}
        <div className="md:col-span-3">
          <InteractiveCard nodeId="CORE_HUB" scanning={true} className="p-8 min-h-[300px] overflow-hidden flex flex-col justify-end">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Rocket size={200} className="text-brand-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 text-[10px] font-black uppercase tracking-widest",
                loading 
                  ? "bg-brand-500/20 text-brand-300 border-brand-500/40 animate-pulse" 
                  : "bg-brand-500/10 border-brand-500/20 text-brand-400"
              )}>
                <Sparkles className={cn("h-3 w-3", loading ? "animate-spin" : "animate-pulse")} />
                <span>{loading ? "Orchestrating Swarm..." : "Autonomous"}</span>
              </div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Neural Core V4<br/><span className="text-slate-500">Operational</span></h2>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Jobs</span>
                  <span className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'in_progress').length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Efficiency</span>
                  <span className="text-2xl font-bold text-green-400">{displayEfficiency.toFixed(1)}%</span>
                </div>
                <Link href="/chat" className="ml-auto px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-brand-400 hover:text-white transition-all active:scale-95">
                  Launch Explorer
                </Link>
              </div>
            </div>
          </InteractiveCard>
        </div>

        {/* Small Stats Grid */}
        <div className="md:col-span-1 grid grid-cols-1 gap-6">
          {stats.slice(0, 2).map((stat, i) => (
            <InteractiveCard key={i} nodeId={`ST_0${i+1}`} className="h-full">
              <StatCard {...stat} />
            </InteractiveCard>
          ))}
        </div>

        {/* Recent Tasks - Main Bento Block */}
        <div className="md:col-span-2">
          <InteractiveCard nodeId="TASK_STREAM" className="flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                Recent Tasks
              </h3>
              <Link href="/workflows" className="text-[10px] font-black text-slate-500 hover:text-brand-400 uppercase tracking-widest transition-colors">
                View All
              </Link>
            </div>
            
            <div className="flex-1 divide-y divide-white/5 overflow-auto max-h-[400px] custom-scrollbar">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task, i) => (
                  <TaskItem key={task.id} task={task} index={i} />
                ))
              ) : (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4 text-slate-600">📡</div>
                  <h4 className="text-white font-medium uppercase text-[10px] tracking-widest">Awaiting Commands</h4>
                  <Link href="/chat" className="mt-4 text-xs font-bold text-brand-400 underline uppercase tracking-widest">Initiate Core</Link>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* File Explorer Module */}
        <div className="md:col-span-2 h-[400px]">
           <FileExplorer />
        </div>

        {/* Agent Activity - Visual Timeline */}
        <div className="md:col-span-3 h-full min-h-[400px]">
          <AgentActivityTimeline />
        </div>

        {/* Remaining Stat Cards */}
        <div className="md:col-span-1 grid grid-cols-1 gap-6">
          {stats.slice(2, 4).map((stat, i) => (
            <InteractiveCard key={i} nodeId={`ST_0${i+3}`} className="h-full">
              <StatCard {...stat} />
            </InteractiveCard>
          ))}
        </div>
      </div>
    </div>
  )
}
