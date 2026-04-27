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
import { tasksApi, agentsApi, conversationsApi } from '@/lib/api'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import TaskItem from '@/components/dashboard/TaskItem'
import AgentActivityTimeline from '@/components/dashboard/AgentActivityTimeline'
import Link from 'next/link'
import InteractiveCard from '@/components/ui/InteractiveCard'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

import FileExplorer from '@/components/dashboard/FileExplorer'

export default function DashboardPage() {
  const { 
    userId, 
    tasks, 
    setTasks, 
    agentActivities, 
    setAgentActivities, 
    isAgentsRunning, 
    activeAgent,
    conversations,
    setConversations,
    setActiveConversation
  } = useStore()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [tasksData, activitiesData, conversationsData] = await Promise.all([
          tasksApi.list(userId),
          agentsApi.getActivities(),
          conversationsApi.list(userId)
        ])
        setTasks(tasksData as any[])
        setAgentActivities(activitiesData as any[])
        setConversations(conversationsData as any[])
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
          <InteractiveCard 
            nodeId="CORE_HUB" 
            scanning={isAgentsRunning} 
            className={cn(
              "p-8 min-h-[300px] overflow-hidden flex flex-col justify-end transition-all duration-700",
              isAgentsRunning ? "border-brand-500/50 shadow-glow-brand/20 bg-brand-500/[0.02]" : ""
            )}
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Rocket size={200} className={cn("transition-colors duration-500", isAgentsRunning ? "text-brand-400" : "text-brand-500")} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 text-[10px] font-black uppercase tracking-widest border",
                  isAgentsRunning 
                    ? "bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-glow-brand/10" 
                    : "bg-white/5 border-white/10 text-slate-400"
                )}>
                  {isAgentsRunning ? (
                    <>
                      <Sparkles className="h-3 w-3 animate-spin text-brand-400" />
                      <span>Agent Active: <span className="text-white ml-1">{activeAgent?.replace('_', ' ')}</span></span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3 text-slate-500" />
                      <span>Autonomous Standby</span>
                    </>
                  )}
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                Neural Core V4<br/>
                <span className={cn(
                  "transition-colors duration-500",
                  isAgentsRunning ? "text-brand-400" : "text-slate-500"
                )}>
                  {isAgentsRunning ? "Processing..." : "Operational"}
                </span>
              </h2>

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Jobs</span>
                  <span className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'in_progress').length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Efficiency</span>
                  <span className="text-2xl font-bold text-green-400">{displayEfficiency.toFixed(1)}%</span>
                </div>
                <Link href="/chat" className={cn(
                  "ml-auto px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95",
                  isAgentsRunning 
                    ? "bg-brand-500 text-white shadow-glow-brand hover:bg-brand-400" 
                    : "bg-white text-black hover:bg-brand-500 hover:text-white"
                )}>
                  {isAgentsRunning ? "View Live Logic" : "Launch Explorer"}
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
          <InteractiveCard nodeId="TASK_STREAM" className="flex flex-col h-[400px] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                Active Task Pipeline
              </h3>
              <Link href="/workflows" className="text-[10px] font-black text-slate-500 hover:text-brand-400 uppercase tracking-widest transition-colors">
                Manage
              </Link>
            </div>
            
            <div className="flex-1 divide-y divide-white/5 overflow-auto custom-scrollbar">
              {tasks.length > 0 ? (
                tasks.slice(0, 10).map((task, i) => {
                  const project = conversations.find(c => c.id === task.conversation_id)
                  return <TaskItem key={task.id} task={task} index={i} projectTitle={project?.title} />
                })
              ) : (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4 text-slate-600 grayscale">📡</div>
                  <h4 className="text-white font-medium uppercase text-[10px] tracking-widest">Awaiting Commands</h4>
                  <Link href="/chat" className="mt-4 text-xs font-bold text-brand-400 underline uppercase tracking-widest">Initiate Core</Link>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* Recent Project Sessions (Past Chats) */}
        <div className="md:col-span-2">
          <InteractiveCard nodeId="PROJECT_HISTORY" className="flex flex-col h-[400px] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                Project History
              </h3>
            </div>
            
            <div className="flex-1 divide-y divide-white/5 overflow-auto custom-scrollbar">
              {conversations.length > 0 ? (
                conversations.slice(0, 10).map((conv: any, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setActiveConversation(conv.id)
                      const router = require('next/navigation').useRouter()
                      router.push('/chat')
                    }}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/10 transition-colors">
                        <Rocket className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate max-w-[180px]">
                          {conv.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {formatDistanceToNow(new Date(conv.created_at))} ago
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4 opacity-20">📂</div>
                  <h4 className="text-white font-medium uppercase text-[10px] tracking-widest opacity-40">No Past Sessions</h4>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* File Explorer Module */}
        <div className="md:col-span-2 h-[450px]">
           <FileExplorer />
        </div>

        {/* Agent Activity - Visual Timeline */}
        <div className="md:col-span-2 h-[450px]">
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
