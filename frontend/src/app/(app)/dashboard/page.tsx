'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import Link from 'next/link'
import InteractiveCard from '@/components/ui/InteractiveCard'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

import FileExplorer from '@/components/dashboard/FileExplorer'
import NeuralSuggestions from '@/components/dashboard/NeuralSuggestions'
import AgentActivityTimeline from '@/components/dashboard/AgentActivityTimeline'

export default function DashboardPage() {
  const router = useRouter()
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

        setTasks((tasksData && tasksData.length > 0) ? (tasksData as any[]) : [])
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
    <div className="w-full max-w-full px-4 lg:px-16 space-y-8 h-full overflow-y-auto pb-32 custom-scrollbar pt-24">
      <div className="px-2">
        <DashboardHeader 
          title="Command Hub" 
          subtitle="Intelligent orchestration of your active AI clusters." 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Top Feature Card - Strategic Overview */}
        <div className="md:col-span-9">
          <InteractiveCard 
            nodeId="CORE_HUB" 
            scanning={isAgentsRunning} 
            className={cn(
              "p-8 min-h-[300px] overflow-hidden flex flex-col justify-end transition-all duration-700",
              isAgentsRunning ? "border-brand/40 shadow-glow-brand/10 bg-brand/5" : ""
            )}
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-1000 pointer-events-none">
              <Rocket size={280} className={cn("transition-colors duration-1000", isAgentsRunning ? "text-brand" : "text-white")} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 text-[10px] font-black uppercase tracking-[0.2em] border",
                  isAgentsRunning 
                    ? "bg-brand/20 text-brand-light border-brand/40 shadow-glow-brand/10" 
                    : "bg-white/5 border-white/10 text-slate-500"
                )}>
                  {isAgentsRunning ? (
                    <>
                      <Sparkles className="h-3 w-3 animate-spin text-brand" />
                      <span>Agent Active: <span className="text-white ml-1">{activeAgent?.replace('_', ' ')}</span></span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3 text-slate-600" />
                      <span>Autonomous Standby</span>
                    </>
                  )}
                </div>
              </div>

              <h2 className="text-4xl font-black text-white mb-4 leading-[1.1] tracking-tight">
                Neural Core<br/>
                <span className={cn(
                  "transition-colors duration-500",
                  isAgentsRunning ? "text-brand" : "text-slate-700"
                )}>
                  {isAgentsRunning ? "Processing Protocol" : "V5 Operational"}
                </span>
              </h2>

              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Active Jobs</span>
                  <span className="text-3xl font-black text-white">{tasks.filter(t => t.status === 'in_progress').length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Efficiency</span>
                  <span className="text-3xl font-black text-brand">{displayEfficiency.toFixed(1)}%</span>
                </div>
                <Link href="/chat" className={cn(
                  "ml-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95",
                  isAgentsRunning 
                    ? "bg-brand text-white shadow-glow-brand hover:bg-brand-light" 
                    : "bg-white text-black hover:bg-brand hover:text-white"
                )}>
                  {isAgentsRunning ? "View Live Logic" : "Launch Explorer"}
                </Link>
              </div>
            </div>
          </InteractiveCard>
        </div>

        {/* Small Stats Grid */}
        <div className="md:col-span-3 grid grid-cols-1 gap-3">
          {stats.slice(0, 2).map((stat, i) => (
            <InteractiveCard key={i} nodeId={`ST_0${i+1}`} className="h-full">
              <StatCard {...stat} />
            </InteractiveCard>
          ))}
        </div>

        {/* Recent Tasks - Main Bento Block */}
        <div className="md:col-span-6">
          <InteractiveCard nodeId="TASK_STREAM" className="flex flex-col h-[500px] overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand/10 text-brand">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                Active Pipeline
              </h3>
              <Link href="/workflows" className="text-[9px] font-black text-slate-600 hover:text-brand uppercase tracking-[0.2em] transition-colors">
                Manage All
              </Link>
            </div>
            
            <div className="flex-1 divide-y divide-white/[0.03] overflow-auto custom-scrollbar">
              {tasks.length > 0 ? (
                tasks.slice(0, 10).map((task, i) => {
                  const project = conversations.find(c => c.id === task.conversation_id)
                  return <TaskItem key={task.id} task={task} index={i} projectTitle={project?.title} />
                })
              ) : (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-5xl mb-6 opacity-10">📡</div>
                  <h4 className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">Awaiting Commands</h4>
                  <Link href="/chat" className="mt-6 text-[10px] font-black text-brand underline uppercase tracking-[0.2em]">Initiate Core</Link>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* Neural Suggestions */}
        <div className="md:col-span-3">
          <InteractiveCard nodeId="NEURAL_SUGGEST" className="h-[500px] p-6">
            <NeuralSuggestions />
          </InteractiveCard>
        </div>

        {/* History */}
        <div className="md:col-span-3">
          <InteractiveCard nodeId="PROJECT_HISTORY" className="flex flex-col h-[500px] overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                Session History
              </h3>
            </div>
            
            <div className="flex-1 divide-y divide-white/[0.03] overflow-y-scroll history-scrollbar min-h-0">
              {conversations.length > 0 ? (
                conversations.map((conv: any, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.05 }}
                    onClick={() => {
                      setActiveConversation(conv.id)
                      router.push('/chat')
                    }}
                    className="p-5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-indigo-500/10 transition-colors">
                        <Rocket className="h-4 w-4 text-slate-600 group-hover:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-white group-hover:text-indigo-400 transition-colors truncate max-w-[150px] uppercase tracking-wider">
                          {conv.title || "Untitled"}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                          {formatDistanceToNow(new Date(conv.updated_at || conv.created_at))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4 opacity-10">📂</div>
                  <h4 className="text-slate-600 font-black uppercase text-[10px] tracking-widest">Archive Empty</h4>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* File Explorer Module */}
        <div className="md:col-span-6 h-[500px]">
           <FileExplorer />
        </div>

        {/* Agent Activity */}
        <div className="md:col-span-6 h-[500px]">
          <InteractiveCard nodeId="ACTIVITY_LOG" className="h-full">
            <AgentActivityTimeline />
          </InteractiveCard>
        </div>

      </div>
    </div>
  )
}
