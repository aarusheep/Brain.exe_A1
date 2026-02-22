// pages/ApprovedLeads.tsx  –  replaces your existing ApprovedLeads.tsx
// Wire up: import this instead of the old one. It fetches real data from api.py.
import { useState, useEffect } from 'react'
import { Search, ChevronDown, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useScoreEngine, type Buyer } from '../hooks/useScoreEngine'

// ── Keep your existing RollingNumber if available, else inline fallback ──────
function RollingNumber({ value }: { value: number }) {
  return <span>{value}</span>
}

const FLAG: Record<string, string> = {
  USA:"🇺🇸", Germany:"🇩🇪", UK:"🇬🇧", France:"🇫🇷", Japan:"🇯🇵",
  Australia:"🇦🇺", Canada:"🇨🇦", Singapore:"🇸🇬", Netherlands:"🇳🇱",
  Italy:"🇮🇹", UAE:"🇦🇪",
}

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  New:       { bg: 'rgba(255,255,255,0.03)', text: '#38bdf8', border: '#1e293b' },
  Contacted: { bg: 'rgba(56,189,248,0.05)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.2)' },
  Responded: { bg: 'rgba(16,185,129,0.05)',  text: '#34d399', border: 'rgba(16,185,129,0.2)' },
  Meeting:   { bg: 'rgba(139,92,246,0.05)',  text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
}

const riskStyle: Record<string, { bg: string; text: string; border: string }> = {
  Low:        { bg: 'rgba(16,185,129,0.08)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  Medium:     { bg: 'rgba(245,158,11,0.08)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  High:       { bg: 'rgba(249,115,22,0.08)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  'Very High':{ bg: 'rgba(239,68,68,0.08)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'white', borderRadius: 12, outline: 'none', fontSize: '0.875rem',
}

type SortKey = 'Score_100' | 'Risk_Friction' | 'accepted_round'

export default function ApprovedLeads() {
  const { leads, round, weights, loading, refreshLeads } = useScoreEngine()

  const [search, setSearch]         = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [sortKey, setSortKey]       = useState<SortKey>('Score_100')

  useEffect(() => { refreshLeads() }, [])

  const filtered = leads
    .filter(l =>
      (riskFilter === 'All' || l.Risk_Label === riskFilter) &&
      (l.Country.toLowerCase().includes(search.toLowerCase()) ||
       l.Industry.toLowerCase().includes(search.toLowerCase()) ||
       l.Buyer_ID.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sortKey === 'Risk_Friction'
        ? a[sortKey] - b[sortKey]
        : (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
    )

  // Summary counts
  const byRisk = leads.reduce((acc, l) => {
    acc[l.Risk_Label] = (acc[l.Risk_Label] ?? 0) + 1; return acc
  }, {} as Record<string, number>)

  const avgScore = leads.length ? (leads.reduce((s, l) => s + l.Score_100, 0) / leads.length).toFixed(1) : '–'

  const summaryData = [
    { label: 'Total Approved', value: leads.length },
    { label: 'Low Risk',       value: byRisk['Low'] ?? 0 },
    { label: 'Medium Risk',    value: byRisk['Medium'] ?? 0 },
    { label: 'High Risk',      value: (byRisk['High'] ?? 0) + (byRisk['Very High'] ?? 0) },
    { label: 'Avg Score',      value: avgScore as any },
  ]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-4xl font-bold tracking-tight uppercase" style={{ color: 'white' }}>Approved Leads</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Round {round} · {leads.length} approved</span>
            <button onClick={refreshLeads} disabled={loading}
              className="p-2 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all"
              style={{ color: '#64748b' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>Buyers approved via score engine · rejected ones re-enter with updated weights.</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="flex gap-3 mb-6">
        {summaryData.map(({ label, value }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(59,130,246,0.1)' }}
            className="flex-1 rounded-xl px-4 py-3.5 text-center premium-card blue-glint">
            <p className="text-xl font-semibold" style={{ color: 'white' }}>
              {typeof value === 'number' ? <RollingNumber value={value}/> : value}
            </p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: '#64748b' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Adaptive weights strip */}
      {weights && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mb-4 rounded-xl border border-white/8 px-4 py-3 flex items-center gap-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[10px] text-slate-600 font-semibold tracking-widest shrink-0">LIVE WEIGHTS</span>
          {[
            { k: 'D1_Product_Compat',  l: 'D1', locked: true },
            { k: 'D2_Geography_Fit',   l: 'D2', locked: true },
            { k: 'D3_Trade_Capacity',  l: 'D3', locked: true },
            { k: 'D4_Intent_Activity', l: 'D4', locked: false },
            { k: 'D5_Reliability',     l: 'D5', locked: false },
          ].map(d => (
            <div key={d.k} className="flex items-center gap-1.5 flex-1">
              <span className="text-[9px] text-slate-600">{d.locked ? '🔒' : ''}{d.l}</span>
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(weights as any)[d.k] * 100}%`, background: d.locked ? '#334155' : '#06b6d4' }}/>
              </div>
              <span className="text-[9px] text-slate-600 font-mono">{((weights as any)[d.k] * 100).toFixed(0)}%</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by country, industry, or buyer ID…"
            className="w-full pl-9 pr-4 py-2.5" style={inputStyle}/>
        </div>
        <div className="relative">
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5" style={inputStyle}>
            {['All', 'Low', 'Medium', 'High', 'Very High'].map(o => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }}/>
        </div>
        <div className="relative">
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
            className="appearance-none pl-4 pr-8 py-2.5" style={inputStyle}>
            <option value="Score_100">Sort: Match Score</option>
            <option value="Risk_Friction">Sort: Risk (low first)</option>
            <option value="accepted_round">Sort: Round</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }}/>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        className="overflow-hidden premium-card blue-glint">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(to bottom right,#0f172a,#020617)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['#', 'Buyer ID', 'Country', 'Industry', 'Channel', 'Score', 'Risk', 'Round'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.72)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => {
              const rs = riskStyle[lead.Risk_Label] ?? riskStyle['Medium']
              const s  = lead.Score_100
              return (
                <motion.tr key={lead.Buyer_ID}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="lead-row"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{i + 1}</td>
                  <td className="px-4 py-3.5 font-mono text-xs" style={{ color: '#38bdf8' }}>{lead.Buyer_ID}</td>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: 'white' }}>
                    {FLAG[lead.Country] ?? ''} {lead.Country}
                  </td>
                  <td className="px-4 py-3.5" style={{ color: '#64748b' }}>{lead.Industry}
                    <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold
                      ${lead.Match_Type === 'Primary' ? 'border-cyan-500/30 text-cyan-500' : 'border-violet-500/30 text-violet-400'}`}>
                      {lead.Match_Type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#64748b' }}>{lead.Preferred_Channel}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s}%`, background: s >= 70 ? '#10b981' : s >= 45 ? '#f59e0b' : '#ef4444' }}/>
                      </div>
                      <span className="font-bold text-xs" style={{ color: s >= 70 ? '#10b981' : s >= 45 ? '#f59e0b' : '#ef4444' }}>
                        {s.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}>
                      {lead.Risk_Label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#64748b' }}>R{lead.accepted_round}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: '#64748b' }}>
            {leads.length === 0 ? 'No approved leads yet — approve buyers in the Swipe view.' : 'No results match your filters.'}
          </p>
        )}
      </motion.div>
    </div>
  )
}
