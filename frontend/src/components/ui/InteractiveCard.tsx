import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  nodeId?: string
  scanning?: boolean
}

export default function InteractiveCard({ children, className, scanning }: InteractiveCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative glass group transition-all duration-500 overflow-hidden",
        scanning && "animate-neural-pulse border-brand/30 shadow-glow-brand/10",
        className
      )}
    >
      {/* Dynamic Shine Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.06)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Inner Glow / Border Highlight */}
      <div className="absolute inset-px rounded-[inherit] border border-white/[0.03] group-hover:border-white/[0.1] transition-colors duration-500 z-10" />

      {/* Main Content */}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>

      {/* Subtle Bottom Glow on Hover */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-brand/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  )
}
