import { useState } from 'react'
import { Bell, CreditCard, HelpCircle, Shield } from 'lucide-react'
import { motion } from 'framer-motion'


const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 16px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
  color: 'rgba(255,255,255,0.04)', fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s',
}

const InputField = ({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#64748b' }}>{label}</label>
    <input type={type} defaultValue={defaultValue} style={inputStyle} />
  </div>
)

const Toggle = ({ label, checked }: { label: string; checked: boolean }) => {
  const [on, setOn] = useState(checked)
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.04)' }}>{label}</span>
      <button
        onClick={() => setOn(!on)}
        className="w-11 h-6 rounded-full relative transition-all duration-200 flex-shrink-0"
        style={{ background: on ? 'linear-gradient(to bottom right, #fde047, #ca8a04)' : '#475569' }}
      >
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: on ? '1.375rem' : '0.25rem' }} />
      </button>
    </label>
  )
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function Profile() {
  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.04)' }}>Profile</h1>
        <p className="text-sm mb-7" style={{ color: '#64748b' }}>Manage your account and preferences.</p>
      </motion.div>

      {/* Avatar */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="show"
        whileHover={{ y: -2, boxShadow: '0 14px 30px rgba(31,41,51,0.09)' }}
        className="flex items-center gap-5 mb-6 p-5 premium-card gold-glint">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-2xl shimmer"
          style={{ background: 'linear-gradient(to bottom right, #fde047, #ca8a04)', boxShadow: '0 4px 16px rgba(47,58,69,0.30)' }}>
          AL
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.04)' }}>Aarusheep Lahoti</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>aarusheep@globexmatch.ai</p>
          <span className="inline-block mt-1.5 text-xs font-semibold px-3 py-1 rounded-full text-white shimmer"
            style={{ background: 'linear-gradient(to right, #fde047, #ca8a04)' }}>
            Admin · Pro Plan
          </span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#ca8a04', background: 'rgba(255,255,255,0.03)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}>
          Change Photo
        </motion.button>
      </motion.div>

      {/* Personal Info */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show" className="p-6 mb-5 premium-card gold-glint">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
          <Shield size={13} /> Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="First Name" defaultValue="Aarusheep" />
          <InputField label="Last Name" defaultValue="Lahoti" />
          <InputField label="Email" defaultValue="aarusheep@globexmatch.ai" type="email" />
          <InputField label="Phone" defaultValue="+91 98765 43210" />
          <InputField label="Role" defaultValue="Export Manager" />
          <InputField label="Timezone" defaultValue="Asia/Kolkata (IST)" />
        </div>
      </motion.div>

      {/* Company Info */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="show" className="p-6 mb-5 premium-card gold-glint">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
          <CreditCard size={13} /> Company Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Company Name" defaultValue="Brain.exe Exports Pvt Ltd" />
          <InputField label="Industry" defaultValue="Manufacturing" />
          <InputField label="Export Markets" defaultValue="Germany, Japan, UAE" />
          <InputField label="Annual Revenue" defaultValue="$5M – $10M" />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="show" className="p-6 mb-5 premium-card gold-glint">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
          <Bell size={13} /> Notification Preferences
        </h3>
        <Toggle label="New lead approved" checked={true} />
        <Toggle label="Meeting scheduled" checked={true} />
        <Toggle label="AI detects buying intent" checked={true} />
        <Toggle label="Conversation replied" checked={false} />
        <Toggle label="Weekly analytics digest" checked={true} />
      </motion.div>

      {/* Billing */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="show" className="mb-5 overflow-hidden premium-card gold-glint">
        <div className="px-6 py-4 flex items-center justify-between shimmer"
          style={{ background: 'linear-gradient(to bottom right, #fde047, #ca8a04)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Billing & Subscription</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Pro Plan – 5 Seats · $299/mo</p>
          </div>
          <CreditCard size={20} className="text-white opacity-60" />
        </div>
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <p className="text-xs" style={{ color: '#64748b' }}>Next billing date</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.04)' }}>March 21, 2026</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#ca8a04', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}>
            Manage Plan
          </motion.button>
        </div>
      </motion.div>

      {/* Support */}
      <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="show"
        className="p-5 flex items-center gap-4 mb-6 premium-card gold-glint">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <HelpCircle size={18} style={{ color: '#ca8a04' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.04)' }}>Need Help?</p>
          <p className="text-xs" style={{ color: '#64748b' }}>Our team is available 24/7 via chat or email.</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} className="btn-gold px-4 py-2 flex-shrink-0">Contact Support</motion.button>
      </motion.div>

      <div className="flex justify-end">
        <motion.button whileTap={{ scale: 0.97 }} className="btn-gold px-6 py-2.5">Save Changes</motion.button>
      </div>
    </div>
  )
}
