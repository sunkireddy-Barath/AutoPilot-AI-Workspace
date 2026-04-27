'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Mic, Paperclip } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (input.trim() && !disabled && !loading) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-20">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative group"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-brand-400/10 to-brand-600/20 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
        
        <div className={cn(
          "relative flex flex-col gap-2 p-3 rounded-[24px] border border-white/10 transition-all duration-300 shadow-2xl overflow-hidden",
          "bg-[#111118]/80 backdrop-blur-3xl focus-within:border-brand-500/40 focus-within:shadow-glow-brand/20",
          "hover:border-white/20"
        )}>
          {/* Subtle Inner Highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Session inactive..." : "Message AutoPilot..."}
                className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 resize-none py-2 px-2 text-[15px] font-medium leading-relaxed min-h-[44px] custom-scrollbar"
                disabled={disabled || loading}
              />
            </div>
            
            <motion.button
              onClick={handleSend}
              whileHover={input.trim() && !loading ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !loading ? { scale: 0.95 } : {}}
              disabled={!input.trim() || disabled || loading}
              className={cn(
                "mt-1 p-2.5 rounded-2xl transition-all duration-300 relative overflow-hidden group/btn",
                input.trim() && !loading
                  ? "bg-brand-600 text-white shadow-glow-brand"
                  : "bg-white/5 text-slate-500 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div
                    key="loading"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full"
                  />
                ) : (
                  <Send className="h-4 w-4 relative z-10 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-2">

              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 text-[10px] font-black uppercase tracking-widest",
                loading 
                  ? "bg-brand-500/20 text-brand-300 border-brand-500/40 animate-pulse border" 
                  : "bg-brand-500/10 border border-brand-500/20 text-brand-400"
              )}>
                <Sparkles className={cn("h-3 w-3", loading ? "animate-spin" : "animate-pulse")} />
                <span>{loading ? "Orchestrating Swarm..." : "Autonomous"}</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-500 font-medium tracking-tight opacity-50 group-hover:opacity-100 transition-opacity">
              Press Enter to send
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
