'use client'

import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'
import GlobalOrchestrator from '@/components/ui/GlobalOrchestrator'
import MeshBackground from '@/components/ui/MeshBackground'
import { Toaster } from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#050508] overflow-hidden">
      {/* Neural Background */}
      <MeshBackground />
      
      {/* Global Orchestrator (WebSocket Logic) */}
      <GlobalOrchestrator />
      
      {/* Main Content Area */}
      <main className="h-screen pt-16 overflow-y-auto relative z-10 custom-scrollbar pb-32">
        {children}
      </main>

      {/* Floating Sidebar / Command Center */}
      <Sidebar />

      {/* Global Components */}
      <TopBar />
      <Toaster position="bottom-right" />
    </div>
  )
}
