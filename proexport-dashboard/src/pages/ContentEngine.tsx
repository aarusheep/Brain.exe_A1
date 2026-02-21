import { Sparkles, Eye, Heart, MessageCircle, PlusCircle, FileText, Clock, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'


const topMetrics = [
    { label: 'Total Reach', value: 48200, suffix: '', display: '48.2K' },
    { label: 'Engagement Rate', value: 6, suffix: '.4%', display: '6.4%' },
    { label: 'Posts This Month', value: 12, suffix: '', display: '12' },
]

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: typeof Check }> = {
    published: { bg: 'rgba(16, 185, 129, 0.05)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)', icon: Check },
    draft: { bg: 'rgba(255,255,255,0.05)', text: '#64748b', border: 'rgba(255,255,255,0.08)', icon: FileText },
    scheduled: { bg: 'rgba(56, 189, 248, 0.05)', text: '#7dd3fc', border: 'rgba(56, 189, 248, 0.2)', icon: Clock },
}

const posts = [
    { title: 'Top 5 Export Markets in 2025', desc: 'A deep dive into the fastest-growing import buyers across automotive and electronics.', status: 'published', views: '4.2K', likes: '231', comments: '48' },
    { title: 'How AI is Transforming B2B Outreach', desc: 'Explore how AI-powered lead engines are replacing cold email with precision targeting.', status: 'scheduled', views: '-', likes: '-', comments: '-' },
    { title: 'ICP Matching: Why 95% Means More Deals', desc: 'High match scores translate directly to faster conversions — here is the data.', status: 'draft', views: '-', likes: '-', comments: '-' },
    { title: 'Germany Manufacturing Report Q1 2025', desc: 'Our AI scanned 1,200 companies — here are the top buyers looking for new suppliers.', status: 'published', views: '2.8K', likes: '142', comments: '29' },
    { title: 'LinkedIn vs Email for Export Outreach', desc: 'Platform performance data from 50,000 AI-sent messages across 20 industries.', status: 'published', views: '3.5K', likes: '188', comments: '37' },
]

export default function ContentEngine() {
    return (
        <div>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h1 className="text-4xl font-bold tracking-tight uppercase mb-1" style={{ color: 'white' }}>Content Engine</h1>
                <p className="text-sm mb-7" style={{ color: '#64748b' }}>AI-generated thought leadership and outreach content.</p>
            </motion.div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {topMetrics.map(({ label, value, suffix }, i) => (
                    <motion.div key={label}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
                        whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(59,130,246,0.1)' }}
                        className="p-5 premium-card blue-glint">
                        <p className="text-3xl font-semibold" style={{ color: 'white' }}>
                            <RollingNumber value={value} suffix={suffix} />
                        </p>
                        <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{label}</p>
                    </motion.div>
                ))}
            </div>

            {/* AI Banner — full metallic gradient with shimmer */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 shimmer"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #38bdf8 100%)',
                    boxShadow: '0 8px 28px rgba(59,130,246,0.2)',
                }}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-white font-semibold text-sm">AI Content Suggestions Ready</p>
                    <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                        8 new posts generated based on your top-performing segments and ICP data.
                    </p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.13)', color: 'white', border: '1px solid rgba(255,255,255,0.22)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)')}>
                    Review Suggestions
                </motion.button>
            </motion.div>

            {/* Content Cards */}
            <div className="space-y-3 mb-6">
                {posts.map(({ title, desc, status, views, likes, comments }, i) => {
                    const s = statusConfig[status]
                    const StatusIcon = s.icon
                    return (
                        <motion.div key={title}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.35 }}
                            whileHover={{ y: -2, boxShadow: '0 14px 30px rgba(59,130,246,0.1)' }}
                            className="p-5 flex gap-4 items-start premium-card blue-glint">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                                <StatusIcon size={16} style={{ color: s.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                    <h3 className="text-sm font-semibold" style={{ color: 'white' }}>{title}</h3>
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 capitalize"
                                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                                        {status}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed mb-2" style={{ color: '#64748b' }}>{desc}</p>
                                {status === 'published' && (
                                    <div className="flex items-center gap-4 text-[11px]" style={{ color: '#64748b' }}>
                                        <span className="flex items-center gap-1"><Eye size={11} /> {views}</span>
                                        <span className="flex items-center gap-1"><Heart size={11} /> {likes}</span>
                                        <span className="flex items-center gap-1"><MessageCircle size={11} /> {comments}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} className="btn-blue flex items-center gap-2 px-6 py-3">
                <PlusCircle size={16} /> Generate New Post
            </motion.button>
        </div >
    )
}
