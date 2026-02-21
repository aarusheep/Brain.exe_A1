import { useState } from 'react'
import { MapPin, Building2, Mail, Linkedin, Users, DollarSign, CheckCircle, XCircle, SkipForward } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'


const stats = [
  { label: 'Weekly Leads', value: 156 },
  { label: 'Approved', value: 0 },
  { label: 'Rejected', value: 0 },
  { label: 'Skipped', value: 0 },
]

export default function ApproveLeads() {
  const [decision, setDecision] = useState<string | null>(null)

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-4xl font-bold tracking-tight uppercase mb-1" style={{ color: 'white' }}>Approve Leads</h1>
        <p className="text-sm mb-7" style={{ color: '#64748b' }}>Review AI-qualified leads and take action.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(59,130,246,0.1)' }}
            className="rounded-xl px-5 py-3.5 text-center premium-card blue-glint"
          >
            <p className="text-2xl font-semibold" style={{ color: 'white' }}><RollingNumber value={value} /></p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#64748b' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!decision ? (
          <motion.div
            key="lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl p-7 premium-card blue-glint"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shimmer"
                  style={{ background: 'linear-gradient(to bottom right, #38bdf8, #0284c7)' }}
                >
                  TC
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: 'white' }}>TechCorp Industries</h2>
                  <p className="text-sm flex items-center gap-1" style={{ color: '#64748b' }}>
                    <Building2 size={12} /> Automotive Manufacturing
                  </p>
                </div>
              </div>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-4 py-1.5 rounded-full text-sm font-bold text-white shimmer"
                style={{ background: 'linear-gradient(to right, #38bdf8, #0284c7)' }}
              >
                95% Match
              </motion.span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="space-y-3">
                {[
                  { Icon: MapPin, text: 'Germany, Stuttgart' },
                  { Icon: Users, text: '500 – 1,000 employees' },
                  { Icon: DollarSign, text: 'Est. Value: $250K' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm" style={{ color: 'white' }}>
                    <Icon size={14} style={{ color: '#64748b' }} />
                    <span className="font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm" style={{ color: 'white' }}>
                  <span className="text-xs font-semibold block mb-0.5" style={{ color: '#64748b' }}>Contact Name</span>
                  <span className="font-medium">Klaus Brandt</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'white' }}>
                  <Mail size={14} style={{ color: '#64748b' }} />
                  <span className="font-medium">k.brandt@techcorp-de.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#0284c7' }}>
                  <Linkedin size={14} />
                  <span className="font-medium">linkedin.com/in/klausbrandt</span>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="rounded-xl px-4 py-3 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#94a3b8' }}>AI Reasoning</p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                High-intent signals detected. Company recently expanded supply chain operations, aligning with your ICP. Decision-maker identified. LinkedIn activity indicates active vendor evaluation.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setDecision('rejected')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(181,64,64,0.08)', border: '1px solid rgba(181,64,64,0.22)', color: '#b54040' }}
              >
                <XCircle size={15} /> Reject
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setDecision('skipped')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
              >
                <SkipForward size={15} /> Skip
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setDecision('approved')}
                className="btn-blue flex items-center gap-2 px-6 py-2.5 ml-auto"
              >
                <CheckCircle size={15} /> Approve
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-md p-8 text-center premium-card blue-glint"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${decision === 'approved' ? 'bg-emerald-100' : decision === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
              {decision === 'approved' ? <CheckCircle size={28} className="text-emerald-600" /> :
                decision === 'rejected' ? <XCircle size={28} className="text-red-500" /> :
                  <SkipForward size={28} style={{ color: '#64748b' }} />}
            </div>
            <h3 className="text-lg font-semibold capitalize mb-1" style={{ color: 'white' }}>Lead {decision}</h3>
            <p className="text-sm mb-5" style={{ color: '#64748b' }}>TechCorp Industries has been {decision}.</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDecision(null)} className="btn-blue px-6 py-2.5">
              Next Lead
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
