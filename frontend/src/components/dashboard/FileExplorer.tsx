'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Folder, Download, Eye, ChevronRight, X, FileCode, FileType } from 'lucide-react'
import { filesApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function FileExplorer() {
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFiles()

    // Listen for global workspace updates from the orchestrator
    const handleUpdate = () => fetchFiles()
    window.addEventListener('workspace_files_updated', handleUpdate)
    
    return () => {
      window.removeEventListener('workspace_files_updated', handleUpdate)
    }
  }, [])

  const fetchFiles = async () => {
    try {
      const data = await filesApi.list()
      setFiles(data)
    } catch (err) {
      console.error("Failed to fetch files", err)
    }
  }

  const handlePreview = async (file: any) => {
    setLoading(true)
    setSelectedFile(file)
    try {
      const data = await filesApi.getContent(file.path)
      setContent(data.content)
    } catch (err) {
      setContent("Error loading file content.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-strong rounded-[32px] border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
            <Folder className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Workspace Output</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Agent Generated Files</p>
          </div>
        </div>
        <button onClick={fetchFiles} className="text-[10px] font-black text-brand-400 hover:text-white uppercase tracking-widest transition-colors">
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
            <Folder className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Workspace is empty</p>
          </div>
        ) : (
          files.map((file) => (
            <motion.div
              key={file.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.04] transition-all cursor-pointer"
              onClick={() => handlePreview(file)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-500/10 transition-colors">
                  {file.type === 'py' || file.type === 'js' ? (
                    <FileCode className="h-4 w-4 text-brand-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">{file.name}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{file.size} • {file.type}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 group-hover:translate-x-1 group-hover:text-brand-400 transition-all" />
            </motion.div>
          ))
        )}
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl h-[80vh] glass-strong border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 shadow-glow-brand/20">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedFile.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedFile.path}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed text-slate-300 custom-scrollbar bg-black/40">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{content}</pre>
                )}
              </div>

              <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-white/[0.01]">
                <button className="px-6 py-2 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  Copy Content
                </button>
                <button className="px-6 py-2 rounded-xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest shadow-glow-brand hover:scale-105 transition-all flex items-center gap-2">
                  <Download className="h-3 w-3" /> Download Artifact
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
