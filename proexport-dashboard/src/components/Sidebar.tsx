import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard, CheckCircle, Users, MessageSquare,
    Calendar, BarChart2, FileText, User, LogOut, Globe, Crown
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/approve-leads', icon: CheckCircle, label: 'Approve Leads' },
    { to: '/approved-leads', icon: Users, label: 'Approved Leads' },
    { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/meetings', icon: Calendar, label: 'Meetings' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/content-engine', icon: FileText, label: 'Content Engine' },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
    const navigate = useNavigate()

    return (
        <aside className="royal-sidebar fixed top-0 left-0 h-screen w-60 flex flex-col z-50">
            {/* Brand Header */}
            <div className="px-6 py-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center shadow-lg shadow-yellow-900/20 relative group">
                        <Globe size={20} className="text-black relative z-10" />
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-white font-black text-sm tracking-tighter uppercase leading-none">
                            GlobeX<span className="text-gradient-gold">Match</span>
                        </h1>
                        <div className="flex items-center gap-1 mt-1">
                            <Crown size={10} className="text-yellow-600" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Royal Edition</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive
                                ? 'nav-active-royal'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    size={16}
                                    className={isActive ? 'text-yellow-500' : 'text-slate-500'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-6 border-t border-white/5">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                >
                    <LogOut size={14} />
                    Term Session
                </motion.button>
            </div>
        </aside>
    )
}
