import { useState } from 'react'
import { motion } from 'framer-motion'
import SplitGlobePage from '../components/globe/SplitGlobePage'
import { CheckCircle2, XCircle, TrendingUp, BarChart3 } from 'lucide-react'

export default function ApproveLeads() {
  const [stats, setStats] = useState({
    approved: 12,
    rejected: 4,
    total: 48
  })

  const handleAction = (type: 'approve' | 'reject') => {
    setStats(prev => ({
      ...prev,
      [type === 'approve' ? 'approved' : 'rejected']: prev[type === 'approve' ? 'approved' : 'rejected'] + 1
    }))
  }

  return (
    <div className="h-full flex flex-col p-0 bg-white">
      {/* Dynamic Stats Bar */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weekly Pipeline</span>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              <span className="text-sm font-bold text-slate-800">{stats.total} Active Leads</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-100" />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Approved</p>
                <p className="text-sm font-black text-slate-800 leading-none">{stats.approved}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100/50">
                <XCircle size={16} className="text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Rejected</p>
                <p className="text-sm font-black text-slate-800 leading-none">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <BarChart3 size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">
            {Math.round(((stats.approved + stats.rejected) / stats.total) * 100)}% Reviewed
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 min-h-0 relative overflow-hidden"
      >
        <SplitGlobePage onAction={handleAction} />
      </motion.div>
    </div>
  )
}
