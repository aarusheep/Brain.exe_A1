import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'


const leads = [
  { company: 'TechCorp Industries', contact: 'Klaus Brandt', lastContact: '1h ago', nextAction: 'AI Follow-up', value: '$250K', match: 95, status: 'Contacted' },
  { company: 'GlobalParts GmbH', contact: 'Anna Fischer', lastContact: '3h ago', nextAction: 'Meeting', value: '$180K', match: 91, status: 'Meeting' },
  { company: 'Nexgen Manufacturing', contact: 'Raj Sharma', lastContact: '1d ago', nextAction: 'Send Proposal', value: '$320K', match: 88, status: 'Responded' },
  { company: 'EuroTrade Logistics', contact: 'Marie Dubois', lastContact: '2d ago', nextAction: 'AI Outreach', value: '$95K', match: 82, status: 'New' },
  { company: 'Meridian Components', contact: 'James Okafor', lastContact: '3d ago', nextAction: 'Follow-up Call', value: '$210K', match: 79, status: 'Contacted' },
  { company: 'SteelCo Exports', contact: 'Lars Mikkelsen', lastContact: '4d ago', nextAction: 'AI Follow-up', value: '$140K', match: 75, status: 'New' },
  { company: 'Horizon Automotive', contact: 'Yuki Tanaka', lastContact: '5d ago', nextAction: 'Schedule Demo', value: '$400K', match: 93, status: 'Responded' },
  { company: 'Pacific Supply Chain', contact: 'Chen Wei', lastContact: '6d ago', nextAction: 'AI Outreach', value: '$160K', match: 70, status: 'New' },
]

const summaryData = [
  { label: 'Total Leads', value: 156 },
  { label: 'New', value: 34 },
  { label: 'Contacted', value: 78 },
  { label: 'Responded', value: 29 },
  { label: 'Meetings', value: 15 },
]

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  New: { bg: 'rgba(255,255,255,0.03)', text: '#38bdf8', border: '#1e293b' },
  Contacted: { bg: 'rgba(56, 189, 248, 0.05)', text: '#7dd3fc', border: 'rgba(56, 189, 248, 0.2)' },
  Responded: { bg: 'rgba(16, 185, 129, 0.05)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  Meeting: { bg: 'rgba(139, 92, 246, 0.05)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'white', borderRadius: 12, outline: 'none', fontSize: '0.875rem',
}

export default function ApprovedLeads() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = leads.filter(l =>
    (statusFilter === 'All' || l.status === statusFilter) &&
    l.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-4xl font-bold tracking-tight uppercase mb-1" style={{ color: 'white' }}>Approved Leads</h1>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>All leads approved for AI outreach.</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="flex gap-3 mb-6">
        {summaryData.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(59,130,246,0.1)' }}
            className="flex-1 rounded-xl px-4 py-3.5 text-center premium-card blue-glint"
          >
            <p className="text-xl font-semibold" style={{ color: 'white' }}><RollingNumber value={value} /></p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: '#64748b' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
            className="w-full pl-9 pr-4 py-2.5" style={inputStyle} />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5" style={inputStyle}>
            {['All', 'New', 'Contacted', 'Responded', 'Meeting'].map(o => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
        </div>
        <div className="relative">
          <select className="appearance-none pl-4 pr-8 py-2.5" style={inputStyle}>
            <option>Sort: Match %</option><option>Sort: Value</option><option>Sort: Date</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        className="overflow-hidden premium-card blue-glint">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(to bottom right, #0f172a, #020617)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Company', 'Contact', 'Last Contact', 'Next Action', 'Deal Value', 'Match', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.72)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => {
              const s = statusStyle[lead.status]
              return (
                <tr key={lead.company} className="lead-row"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: 'white' }}>{lead.company}</td>
                  <td className="px-4 py-3.5" style={{ color: '#64748b' }}>{lead.contact}</td>
                  <td className="px-4 py-3.5" style={{ color: '#64748b' }}>{lead.lastContact}</td>
                  <td className="px-4 py-3.5 font-medium" style={{ color: '#38bdf8' }}>{lead.nextAction}</td>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: 'white' }}>{lead.value}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ color: '#94a3b8' }}>{lead.match}%</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-10 text-sm" style={{ color: '#64748b' }}>No results found.</p>}
      </motion.div>
    </div>
  )
}
