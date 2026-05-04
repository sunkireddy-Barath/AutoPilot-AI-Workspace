'use client'

import { motion } from 'framer-motion'
import { Rocket, Shield, Zap, Layout, ArrowRight, Brain, Share2, Activity } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-brand-500/30 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-strong px-6 py-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-500 shadow-glow-brand" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-white">AutoPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Orchestration</Link>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors">Dashboard</Link>
          </div>
          <Link 
            href="/auth"
            className="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-glow-white/10"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Zap className="h-4 w-4 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Next Gen AI Orchestration v2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8"
          >
            Your Goals. <br/>
            <span className="text-brand-500">AutoPilot</span> Execution.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            The world's first autonomous multi-agent workspace. Describe a goal, and watch a swarm of specialized AI agents plan, build, and optimize your entire workflow in real-time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/auth" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 text-white font-black text-xs uppercase tracking-widest hover:bg-brand-500 transition-all shadow-glow-brand flex items-center justify-center gap-3 group"
            >
              Start Your First Project <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              View Demo Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-xs font-black text-brand-500 uppercase tracking-[0.4em] mb-4">Core Intelligence</h2>
            <h3 className="text-4xl font-black text-white tracking-tighter">Everything you need to automate reality.</h3>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { 
                title: "Multi-Agent Swarm", 
                desc: "Specialized agents for Product, Engineering, and Marketing working in perfect harmony.", 
                icon: Brain,
                color: "text-indigo-400",
                bg: "bg-indigo-400/10"
              },
              { 
                title: "Visual Orchestration", 
                desc: "Real-time node-based workflow representation with live communication handoffs.", 
                icon: Share2,
                color: "text-brand-400",
                bg: "bg-brand-400/10"
              },
              { 
                title: "Neural Insights", 
                desc: "Autonomous data synthesis and project velocity tracking with AI recommendations.", 
                icon: Activity,
                color: "text-green-400",
                bg: "bg-green-400/10"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={item}
                className="glass-strong p-8 rounded-[32px] border border-white/5 hover:border-brand-500/30 transition-all group"
              >
                <div className={cn("p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 duration-500", feature.bg, feature.color)}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-black text-white mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[48px] bg-brand-600 p-12 md:p-24 text-center relative overflow-hidden shadow-glow-brand/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-48 -mt-48" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8">Ready to initiate?</h2>
            <p className="text-white/70 text-lg font-medium max-w-xl mx-auto mb-12">
              Join 1,000+ founders and developers using AutoPilot to turn vision into verified execution.
            </p>
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
            >
              Get Started for Free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AutoPilot AI Workspace</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            © 2026 MeDo Orchestrator. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
