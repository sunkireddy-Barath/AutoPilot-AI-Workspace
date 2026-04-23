import { cn } from '@/lib/utils'

interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  nodeId?: string
  scanning?: boolean
}

export default function InteractiveCard({ children, className }: InteractiveCardProps) {
  return (
    <div
      className={cn(
        "relative glass group transition-all duration-300",
        className
      )}
    >
      {/* Dynamic Shine Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] blur-2xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>

      {/* Border Glow interaction */}
      <div className="absolute inset-px rounded-[inherit] border border-white/5 transition-colors group-hover:border-brand-500/20 z-10" />
    </div>
  )
}
