'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
}

const QUICK_PROMPTS = [
  'Start a fitness startup from scratch',
  'Build a SaaS product roadmap',
  'Launch a marketing campaign',
  'Analyze my e-commerce business',
]

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { autonomousMode, setAutonomousMode } = useStore()

  const canSend = input.trim().length > 0 && !disabled && !loading

  const handleSend = () => {
    if (!canSend) return
    onSend(input.trim())
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

  return (
    <div className="relative w-full max-w-3xl mx-auto z-20">

      {/* Quick prompt chips — only visible when input is empty */}
      <AnimatePresence>
        {input.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex flex-wrap gap-2 mb-3 justify-center"
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt)
                  textareaRef.current?.focus()
                }}
                disabled={disabled}
                className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] font-bold text-slate-500 hover:text-white hover:border-brand-500/30 hover:bg-brand-500/10 transition-all duration-200 truncate max-w-[200px] disabled:opacity-30"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative group"
      >
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-brand-400/10 to-brand-600/20 rounded-[26px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

        <div className={cn(
          'relative flex flex-col gap-1 p-3 rounded-[22px] border transition-all duration-300 shadow-2xl overflow-hidden',
          'bg-[#08080c]/90 backdrop-blur-3xl',
          'focus-within:border-brand-500/40 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.15)]',
          'hover:border-white/15',
          loading ? 'border-brand-500/30' : 'border-white/8'
        )}>
          {/* Inner gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.015] to-transparent pointer-events-none rounded-[22px]" />

          <div className="flex items-end gap-3">
            {/* Textarea */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  disabled
                    ? 'Session inactive — please log in'
                    : loading
                    ? 'Agents are processing...'
                    : 'Describe your business goal, project, or question...'
                }
                className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-600 resize-none py-2 px-2 text-[14px] font-medium leading-relaxed min-h-[44px] custom-scrollbar"
                disabled={disabled || loading}
              />
            </div>

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              whileHover={canSend ? { scale: 1.06 } : {}}
              whileTap={canSend ? { scale: 0.94 } : {}}
              disabled={!canSend}
              className={cn(
                'mb-1 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden shrink-0',
                canSend
                  ? 'bg-brand-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-brand-500'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              )}
            >
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div
                    key="spin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Send className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-1">
            {/* Left: Autonomous mode toggle + status */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutonomousMode(!autonomousMode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 text-[10px] font-black uppercase tracking-widest border',
                  autonomousMode
                    ? 'bg-brand-500/15 text-brand-300 border-brand-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                    : 'bg-white/[0.03] border-white/8 text-slate-600 hover:text-slate-400'
                )}
              >
                <Sparkles className={cn('h-3 w-3', autonomousMode ? 'animate-pulse text-brand-400' : '')} />
                <span>Auto {autonomousMode ? 'On' : 'Off'}</span>
              </button>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-widest"
                >
                  <Zap className="h-3 w-3 animate-pulse" />
                  Swarm Processing...
                </motion.div>
              )}
            </div>

            {/* Right: Keyboard hint */}
            <div className="flex items-center gap-2">
              {input.length > 0 && (
                <span className="text-[9px] text-slate-600 font-medium tabular-nums">
                  {input.length}
                </span>
              )}
              <span className="text-[10px] text-slate-700 font-medium tracking-tight">
                ↵ Send · ⇧↵ Newline
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
