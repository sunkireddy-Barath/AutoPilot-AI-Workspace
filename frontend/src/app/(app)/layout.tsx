'use client'

import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'
import GlobalOrchestrator from '@/components/ui/GlobalOrchestrator'
import MeshBackground from '@/components/ui/MeshBackground'
import { Toaster } from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-950 overflow-hidden">
      {/* Neural Background */}
      <MeshBackground />
      
      {/* Global Orchestrator (WebSocket Logic) */}
      <GlobalOrchestrator />
      
      {/* Main Content Area - Full Width & Height */}
      <main className="h-screen relative z-10 overflow-hidden">
        <div className="h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Global Floating Dock */}
      <Sidebar />

      {/* Global Navigation Bar */}
      <TopBar />
      
      {/* Toaster with Custom Styling */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(10, 10, 15, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }
        }}
      />
    </div>
  )
}
