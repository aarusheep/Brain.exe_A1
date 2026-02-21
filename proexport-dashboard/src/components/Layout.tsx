import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden">
            {/* Ambient Background Glows — Global */}
            <div className="ambient-glow top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20" />
            <div className="ambient-glow bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10" />
            <div className="ambient-glow top-[20%] right-[5%] w-[30%] h-[30%] bg-amber-900/5" style={{ animationDelay: '-5s' }} />

            <Sidebar />

            <main className="flex-1 ml-60 p-8 relative z-10 min-h-screen overflow-y-auto">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    )
}
