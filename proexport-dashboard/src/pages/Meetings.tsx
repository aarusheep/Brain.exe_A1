import { Video, Phone, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'


const statCards = [
  { label: 'This Week', value: 8 },
  { label: 'Completed', value: 24 },
  { label: 'Success Rate', value: 75, suffix: '%' },
]

const upcoming = [
  { title: 'Product Demo', company: 'TechCorp Industries', date: 'Mon, Feb 24', time: '10:00 AM', type: 'Video', icon: Video },
  { title: 'Discovery Call', company: 'GlobalParts GmbH', date: 'Tue, Feb 25', time: '2:00 PM', type: 'Call', icon: Phone },
  { title: 'Proposal Review', company: 'Nexgen Manufacturing', date: 'Wed, Feb 26', time: '11:30 AM', type: 'Video', icon: Video },
  { title: 'Strategy Session', company: 'Meridian Components', date: 'Thu, Feb 27', time: '3:00 PM', type: 'Call', icon: Phone },
]

const past = [
  { title: 'Intro Call', company: 'SteelCo Exports', date: 'Feb 18', result: 'Positive', icon: Phone },
  { title: 'Demo Session', company: 'EuroTrade Logistics', date: 'Feb 17', result: 'Follow-up', icon: Video },
  { title: 'Pricing Review', company: 'Horizon Automotive', date: 'Feb 15', result: 'Closed Won', icon: Video },
  { title: 'Q&A Call', company: 'Pacific Supply Chain', date: 'Feb 14', result: 'Pending', icon: Phone },
]

const resultStyle: Record<string, { bg: string; text: string; border: string }> = {
  'Positive': { bg: 'rgba(16, 185, 129, 0.05)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  'Closed Won': { bg: 'rgba(56, 189, 248, 0.05)', text: '#7dd3fc', border: 'rgba(56, 189, 248, 0.2)' },
  'Follow-up': { bg: 'rgba(139, 92, 246, 0.05)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
  'Pending': { bg: 'rgba(255,255,255,0.05)', text: '#64748b', border: 'rgba(255,255,255,0.08)' },
}

export default function Meetings() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-4xl font-bold tracking-tight uppercase mb-1" style={{ color: 'white' }}>Meetings</h1>
        <p className="text-sm mb-7" style={{ color: '#64748b' }}>Track all scheduled and past meetings.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, suffix }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(59,130,246,0.1)' }}
            className="p-5 text-center premium-card blue-glint">
            <p className="text-3xl font-semibold" style={{ color: 'white' }}>
              <RollingNumber value={value} suffix={suffix ?? ''} />
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Upcoming */}
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
        <Calendar size={13} /> Upcoming Meetings
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {upcoming.map((m, i) => (
          <motion.div key={m.title + m.company}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(59,130,246,0.1)' }}
            className="p-5 premium-card blue-glint">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'white' }}>{m.title}</h3>
                <p className="text-xs" style={{ color: '#64748b' }}>{m.company}</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.08)' }}>
                <m.icon size={11} /> {m.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: '#64748b' }}>
                <span className="font-semibold" style={{ color: 'white' }}>{m.date}</span> · {m.time}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} className="btn-blue flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <Video size={11} /> Join Meeting
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Past */}
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Past Meetings</h2>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
        className="overflow-hidden premium-card blue-glint">
        {past.map((m, i) => {
          const s = resultStyle[m.result]
          return (
            <div key={m.title} className="flex items-center px-5 py-4 lead-row"
              style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent', borderBottom: i < past.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mr-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <m.icon size={15} style={{ color: '#38bdf8' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'white' }}>{m.title}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{m.company}</p>
              </div>
              <p className="text-xs mr-6" style={{ color: '#64748b' }}>{m.date}</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                {m.result}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
