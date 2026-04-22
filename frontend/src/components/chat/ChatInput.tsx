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
    <div className="p-4 bg-surface-900 border-t border-white/5">
      <div className="max-w-4xl mx-auto relative group">
        <div className={cn(
          "relative glass-strong flex flex-col gap-2 p-2 focus-within:ring-2 focus-within:ring-brand-500/60 transition-all duration-300 bg-surface-900/40 backdrop-blur-md",
          "hover:border-white/10 focus-within:bg-surface-900/60"
        )}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "No active session. Click 'New Session' to start." : "Tell AutoPilot your next goal..."}
            className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 resize-none py-3 px-4 text-sm min-h-[48px]"
            disabled={disabled || loading}
          />

          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-500/10 text-[10px] font-black uppercase text-brand-400 tracking-wider border border-brand-500/20 overflow-hidden group/badge">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/badge:animate-[shimmer_1.5s_infinite]" />
                <Sparkles className="h-3 w-3 animate-pulse text-brand-300" />
                <span className="relative z-10">Autonomous Ready</span>
              </div>
            </div>

            <motion.button
              onClick={handleSend}
              whileHover={input.trim() && !loading ? { scale: 1.05, y: -1 } : {}}
              whileTap={input.trim() && !loading ? { scale: 0.95 } : {}}
              disabled={!input.trim() || disabled || loading}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 active:scale-95 relative overflow-hidden group/btn",
                input.trim() && !loading
                  ? "bg-brand-600 text-white shadow-[0_0_15px_rgba(var(--brand-600),0.5)] hover:shadow-[0_0_25px_rgba(var(--brand-600),0.7)] hover:bg-brand-500 hover:-translate-y-0.5"
                  : "bg-surface-700 text-slate-500 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <Send className="h-4 w-4 relative z-10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 text-center mt-3 font-medium">
          Shift + Enter for new line. AutoPilot will automatically break down your goal into agents and tasks.
        </p>
      </div>
    </div>
  )
}
