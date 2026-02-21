import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { motion } from 'framer-motion'


const conversations = [
  { id: 1, company: 'TechCorp Industries', contact: 'Klaus Brandt', preview: 'Sounds interesting, can you share more?', time: '2m', unread: 2 },
  { id: 2, company: 'GlobalParts GmbH', contact: 'Anna Fischer', preview: 'We are open to a demo next week.', time: '1h', unread: 0 },
  { id: 3, company: 'Nexgen Manufacturing', contact: 'Raj Sharma', preview: 'Thank you for the proposal.', time: '3h', unread: 1 },
  { id: 4, company: 'EuroTrade Logistics', contact: 'Marie Dubois', preview: 'Please send the pricing sheet.', time: '1d', unread: 0 },
  { id: 5, company: 'Meridian Components', contact: 'James Okafor', preview: 'I will check with my team.', time: '2d', unread: 0 },
]

const initialMessages = [
  { from: 'ai', text: 'Hi Klaus, I reached out because TechCorp aligns perfectly with our export solutions. Would you be open to a quick 15-min call this week?', time: '10:04 AM' },
  { from: 'user', text: 'Sounds interesting, can you share more details about what you offer?', time: '10:32 AM' },
  { from: 'ai', text: `Absolutely! GlobeXMatch uses AI to match manufacturers with verified global buyers. We've helped 200+ companies expand into 40+ markets. I'd love to show you a live demo tailored to your product line.`, time: '10:33 AM' },
  { from: 'user', text: 'That sounds promising. What does the process look like?', time: '11:15 AM' },
]

export default function Conversations() {
  const [selected, setSelected] = useState(conversations[0])
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { from: 'ai', text: input, time: 'Now' }])
    setInput('')
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-4xl font-bold tracking-tight uppercase mb-1" style={{ color: 'white' }}>Conversations</h1>
        <p className="text-sm mb-5" style={{ color: '#64748b' }}>AI-managed outreach threads.</p>
      </motion.div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 190px)' }}>
        {/* List */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          className="w-72 flex-shrink-0 flex flex-col overflow-hidden premium-card blue-glint">
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input placeholder="Search…" className="w-full px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left px-4 py-3.5 transition-all duration-200"
                style={{
                  background: selected.id === c.id ? 'linear-gradient(135deg,rgba(56,189,248,0.05),rgba(56,189,248,0.1))' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: selected.id === c.id ? '3px solid #38bdf8' : '3px solid transparent',
                }}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-sm font-semibold truncate" style={{ color: 'white' }}>{c.company}</span>
                  <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: '#64748b' }}>{c.time}</span>
                </div>
                <p className="text-xs truncate" style={{ color: '#64748b' }}>{c.contact}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: '#64748b' }}>{c.preview}</p>
                {c.unread > 0 && (
                  <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white shimmer"
                    style={{ background: 'linear-gradient(to bottom right, #38bdf8, #0284c7)' }}>
                    {c.unread} new
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chat */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col overflow-hidden premium-card blue-glint">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'white' }}>{selected.company}</h3>
              <p className="text-xs" style={{ color: '#64748b' }}>{selected.contact}</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white shimmer"
              style={{ background: 'linear-gradient(to right, #38bdf8, #0284c7)' }}>
              95% Match
            </span>
          </div>

          {/* AI Banner */}
          <div className="mx-4 mt-3 mb-1 px-4 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Bot size={14} style={{ color: '#38bdf8' }} />
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>AI is handling this conversation</span>
            <span className="ml-auto text-[10px]" style={{ color: '#64748b' }}>Auto-mode ON</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}>
                {msg.from === 'ai' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 shimmer"
                    style={{ background: 'linear-gradient(to bottom right, #38bdf8, #0284c7)' }}>
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={msg.from === 'ai'
                    ? { background: 'linear-gradient(to bottom right, #38bdf8, #0284c7)', color: 'white', borderBottomLeftRadius: 4 }
                    : { background: 'rgba(255,255,255,0.1)', color: 'white', borderBottomRightRadius: 4 }
                  }>
                  {msg.text}
                  <div className="text-[10px] mt-1 opacity-60">{msg.time}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message or let AI handle it…"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
            <motion.button whileTap={{ scale: 0.97 }} onClick={send} className="btn-blue px-4 py-2.5 flex items-center gap-1.5">
              <Send size={14} /> Send
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
