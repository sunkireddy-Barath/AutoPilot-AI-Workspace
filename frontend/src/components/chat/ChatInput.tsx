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
        {/* Glow effect on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
        
        <div className="relative glass-strong flex flex-col gap-2 p-2 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell AutoPilot your next goal..."
            className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 resize-none py-3 px-4 text-sm min-h-[48px]"
            disabled={disabled || loading}
          />

          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Attach file">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Voice input">
                <Mic className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-500/10 text-[10px] font-black uppercase text-brand-400 tracking-wider border border-brand-500/20">
                <Sparkles className="h-3 w-3" />
                Autonomous Ready
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled || loading}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 active:scale-95",
                input.trim() && !loading
                  ? "bg-brand-600 text-white shadow-glow-brand"
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
                  >
                    <Send className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 text-center mt-3 font-medium">
          Shift + Enter for new line. AutoPilot will automatically break down your goal into agents and tasks.
        </p>
      </div>
    </div>
  )
}
