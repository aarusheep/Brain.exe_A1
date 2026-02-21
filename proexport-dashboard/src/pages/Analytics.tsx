import { motion } from 'framer-motion'
import RollingNumber from '../components/RollingNumber'
import AnimatedBar from '../components/AnimatedBar'


const topMetrics = [
  { label: 'Total Leads', value: 156, suffix: '', delta: '+12%', pos: true },
  { label: 'Approval Rate', value: 68, suffix: '%', delta: '+5%', pos: true },
  { label: 'Response Rate', value: 42, suffix: '%', delta: '-3%', pos: false },
  { label: 'Meeting Conversion', value: 15, suffix: '%', delta: '+8%', pos: true },
]

const channels = [
  { name: 'Email', sent: 2340, responses: 983, rate: 42, color: '#94a3b8' },
  { name: 'LinkedIn', sent: 1820, responses: 564, rate: 31, color: '#ca8a04' },
  { name: 'WhatsApp', sent: 980, responses: 176, rate: 18, color: '#0d9488' },
  { name: 'Phone', sent: 450, responses: 41, rate: 9, color: '#8096a8' },
]

const icpBuckets = [
  { range: '90–100%', count: 34, color: 'rgba(255,255,255,0.04)' },
  { range: '80–89%', count: 58, color: '#94a3b8' },
  { range: '70–79%', count: 42, color: '#ca8a04' },
  { range: '60–69%', count: 22, color: '#475569' },
]
const icpTotal = icpBuckets.reduce((a, b) => a + b.count, 0)

const segments = [
  { name: 'Automotive – Germany', leads: 34, rate: '52%' },
  { name: 'Electronics – Japan', leads: 28, rate: '44%' },
  { name: 'Textiles – India', leads: 22, rate: '38%' },
  { name: 'Mining – Australia', leads: 18, rate: '31%' },
]

export default function Analytics() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.04)' }}>Analytics</h1>
        <p className="text-sm mb-7" style={{ color: '#64748b' }}>Performance insights across your pipeline.</p>
      </motion.div>

      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {topMetrics.map(({ label, value, suffix, delta, pos }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(31,41,51,0.10)' }}
            className="p-5 premium-card gold-glint">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>{label}</p>
            <p className="text-3xl font-semibold" style={{ color: 'rgba(255,255,255,0.04)' }}>
              <RollingNumber value={value} suffix={suffix} />
            </p>
            <span className={`text-xs font-medium ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{pos ? '▲' : '▼'} {delta}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Channel Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
          className="col-span-2 p-6 premium-card gold-glint">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#64748b' }}>Channel Performance</h2>
          {channels.map(({ name, sent, responses, rate, color }) => (
            <div key={name} className="mb-5">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="font-semibold" style={{ color: '#94a3b8' }}>{name}</span>
                <span style={{ color: '#64748b' }}>{sent.toLocaleString()} sent · {responses.toLocaleString()} responses</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <AnimatedBar percent={rate} color={`linear-gradient(90deg,${color},${color}aa)`} />
                </div>
                <span className="text-sm font-bold w-8 text-right" style={{ color }}>{rate}%</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right column */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            className="p-5 premium-card gold-glint">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>ICP Match Distribution</h2>
            <div className="space-y-3">
              {icpBuckets.map(({ range, count, color }) => (
                <div key={range}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: '#94a3b8' }}>{range}</span>
                    <span style={{ color: '#64748b' }}>{count} leads</span>
                  </div>
                  <AnimatedBar percent={(count / icpTotal) * 100} color={color} />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
            className="p-5 premium-card gold-glint">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>Top Segments</h2>
            <div className="space-y-2.5">
              {segments.map(({ name, leads, rate }, i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0 shimmer"
                    style={{ background: 'linear-gradient(to bottom right, #fde047, #ca8a04)' }}>{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.04)' }}>{name}</p>
                    <p className="text-[11px]" style={{ color: '#64748b' }}>{leads} leads · {rate} rate</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
