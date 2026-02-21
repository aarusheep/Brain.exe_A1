import { TrendingUp, Calendar, Bot, Zap, Anchor, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'

export default function RoyalDarkDashboard() {
    return (
        <div className="relative min-h-screen bg-royal overflow-hidden px-10 py-8 text-white">

            {/* Header Section */}
            <header className="relative z-10 flex justify-between items-center mb-12">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
                            Enterprise Access • Trade Intelligence
                        </span>
                    </div>

                    <h1 className="text-4xl font-light tracking-tight uppercase">
                        Global <span className="font-bold text-gradient-blue italic">Operation</span>
                    </h1>
                </motion.div>

                <div className="flex gap-4">
                    <button className="btn-outline">Archive</button>
                    <button className="btn-blue">New Protocol</button>
                </div>
            </header>


            {/* Premium Metrics Grid */}
            <div className="grid grid-cols-4 gap-6 mb-10 relative z-10">
                {[
                    { label: 'Active Trade Leads', value: 156, suffix: '', change: '+12%', pos: true },
                    { label: 'Global Response', value: 68, suffix: '%', change: '+5%', pos: true },
                    { label: 'Asset Scheduling', value: 24, suffix: '', change: '+18%', pos: true },
                    { label: 'Market Conversion', value: 15, suffix: '%', change: '+3%', pos: true },
                ].map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="premium-card p-7 rounded-2xl group cursor-default"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5 group-hover:text-blue-400 transition-colors">
                            {m.label}
                        </p>

                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tighter">
                                <RollingNumber value={m.value} suffix={m.suffix} />
                            </span>
                        </div>

                        <div className={`mt-4 text-[10px] font-bold inline-flex items-center gap-1 ${m.pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.pos ? '▲' : '▼'} {m.change}
                            <span className="text-slate-600 font-medium lowercase italic">
                                vs baseline
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>


            <div className="grid grid-cols-12 gap-8 relative z-10">

                {/* Main Pipeline Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-8 premium-card rounded-3xl p-8"
                >
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                            <ShieldCheck size={18} className="text-blue-500" />
                            Pipeline Integrity
                        </h2>
                        <div className="text-[10px] font-mono text-slate-600">
                            ID: TX-9902-B
                        </div>
                    </div>

                    <div className="space-y-10">
                        {[
                            { label: 'Lead Verification', val: '156 leads', pct: 78 },
                            { label: 'AI Diplomatic Outreach', val: '112 sent', pct: 62 },
                            { label: 'High-Level Meetings', val: '24 booked', pct: 35 },
                        ].map((p, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[11px] font-bold uppercase text-slate-300 tracking-widest">
                                        {p.label}
                                    </span>
                                    <span className="text-[11px] font-mono text-blue-400">
                                        {p.val}
                                    </span>
                                </div>

                                <div className="h-[6px] bg-white/5 rounded-full overflow-hidden relative p-[1px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.pct}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Performance Indicators */}
                    <div className="mt-16 grid grid-cols-4 gap-8 pt-8 border-t border-white/5">
                        {[
                            { label: 'Email', pct: 42 },
                            { label: 'LinkedIn', pct: 31 },
                            { label: 'Direct', pct: 18 },
                            { label: 'Encrypted', pct: 9 },
                        ].map((c, i) => (
                            <div key={i} className="text-center group">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-blue-500/30 bg-white/5 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <span className="text-xs font-bold">{c.pct}%</span>
                                </div>
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                    {c.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>


                {/* Right Column */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="col-span-4 premium-card rounded-3xl flex flex-col"
                >
                    <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
                        <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                            <Zap size={14} fill="currentColor" />
                            Live Operations
                        </h2>
                    </div>

                    <div className="p-8 space-y-8 flex-1">
                        {[
                            { icon: Bot, text: 'AI automated Customs clearance', time: '2m ago' },
                            { icon: Calendar, text: 'Consulate meeting confirmed', time: '18m ago' },
                            { icon: Anchor, text: 'Vessel docked in Port of Singapore', time: '1h ago' },
                            { icon: TrendingUp, text: 'Detected buying surge: EU Sector', time: '3h ago' },
                        ].map((act, i) => (
                            <div key={i} className="flex gap-5 group">
                                <div className="mt-1">
                                    <act.icon size={16} className="text-blue-400 group-hover:scale-125 transition-transform" />
                                </div>
                                <div className="flex-1 border-b border-white/5 pb-4">
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                        {act.text}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-600 mt-1 uppercase italic">
                                        {act.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 pt-0">
                        <button className="w-full py-4 bg-slate-800 border border-blue-500/20 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-slate-700 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
                            Full Audit Logs
                        </button>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}