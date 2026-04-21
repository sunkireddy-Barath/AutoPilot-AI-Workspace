'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity,
  ArrowRight
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { tasksApi, agentsApi } from '@/lib/api'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import TaskItem from '@/components/dashboard/TaskItem'
import Link from 'next/link'

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
      value: '98%', 
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
    <div className="p-8 max-w-7xl mx-auto">
      <DashboardHeader 
        title="Dashboard" 
        subtitle="Overview of your AI-driven workspace and automation progress." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Rocket className="h-4 w-4 text-brand-400" />
                Recent Tasks
              </h3>
              <Link 
                href="/workflows" 
                className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="divide-y divide-white/5">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task, i) => (
                  <TaskItem key={task.id} task={task} index={i} />
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h4 className="text-white font-medium">No tasks yet</h4>
                  <p className="text-slate-500 text-sm mt-1 mb-6">Describe a goal in the Command Center to start generating tasks.</p>
                  <Link href="/chat" className="btn-primary inline-flex">Go to Chat</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Activity Timeline */}
        <div className="space-y-6">
          <div className="glass p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-400" />
              Agent Activity
            </h3>
            
            <div className="space-y-6">
              {agentActivities.length > 0 ? (
                agentActivities.slice(0, 6).map((activity, i) => (
                  <div key={i} className="relative pl-6 pb-6 last:pb-0">
                    {i !== agentActivities.slice(0, 6).length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-surface-600" />
                    )}
                    <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-surface-800 border-2 border-surface-600 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    </div>
                    
                    <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
                      {activity.agent_role.replace('_', ' ')}
                    </div>
                    <div className="text-sm font-medium text-white">{activity.action}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{activity.detail}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm text-center py-8">No activity logs yet</div>
              )}
            </div>
            
            <Link href="/agents" className="block text-center text-xs font-medium text-slate-400 hover:text-white mt-6 transition-colors">
              View Deployment Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
