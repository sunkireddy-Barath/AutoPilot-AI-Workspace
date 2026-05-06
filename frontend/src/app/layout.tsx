import type { Metadata, Viewport } from 'next'
import './globals.css'
import FirebaseProvider from '@/components/auth/FirebaseProvider'

export const metadata: Metadata = {
  title: 'AutoPilot AI Workspace',
  description:
    'An AI-powered multi-agent system that converts your high-level goals into structured workflows, automated tasks, and real-time execution plans.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'AutoPilot AI Workspace',
    description: 'Multi-agent AI that runs your business automatically.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-surface-900 text-slate-100 antialiased">
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  )
}
