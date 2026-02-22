// components/globe/SplitGlobePage.tsx
// Uses react-globe.gl (already in your package.json) for a real 3D globe

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { CheckCircle2, XCircle, Zap } from "lucide-react"
import Globe from "react-globe.gl"
import { useScoreEngine, type Buyer } from "@/hooks/useScoreEngine"

interface Props {
  onAction: (type: "approve" | "reject") => void
  onLoad: (count: number) => void
}

const FLAG: Record<string, string> = {
  USA:"🇺🇸", Germany:"🇩🇪", UK:"🇬🇧", France:"🇫🇷", Japan:"🇯🇵",
  Australia:"🇦🇺", Canada:"🇨🇦", Singapore:"🇸🇬", Netherlands:"🇳🇱",
  Italy:"🇮🇹", UAE:"🇦🇪", India:"🇮🇳",
}

const COORDS: Record<string, { lat: number; lng: number }> = {
  USA:         { lat: 37.09,  lng: -95.71 },
  Germany:     { lat: 51.16,  lng: 10.45  },
  UK:          { lat: 55.37,  lng: -3.43  },
  France:      { lat: 46.22,  lng: 2.21   },
  Japan:       { lat: 36.20,  lng: 138.25 },
  Australia:   { lat: -25.27, lng: 133.77 },
  Canada:      { lat: 56.13,  lng: -106.34},
  Singapore:   { lat: 1.35,   lng: 103.82 },
  Netherlands: { lat: 52.13,  lng: 5.29   },
  Italy:       { lat: 41.87,  lng: 12.56  },
  UAE:         { lat: 23.42,  lng: 53.84  },
  India:       { lat: 20.59,  lng: 78.96  },
}

// ── 3D Globe with react-globe.gl ─────────────────────────────────────────────
function TradeGlobe({ buyers, approvedLeads }: { buyers: Buyer[]; approvedLeads: Buyer[] }) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)

  // Points: HQ (India) + current buyers + approved leads
  const points = useMemo(() => {
    const pts: any[] = [
      {
        lat: 20.59, lng: 78.96,
        size: 0.6, color: "#fcd34d",
        label: "HQ · India",
        type: "hq",
      },
    ]
    buyers.forEach(b => {
      const c = COORDS[b.Country]
      if (!c) return
      const col = b.Score_100 >= 70 ? "#22d3ee" : b.Score_100 >= 45 ? "#f59e0b" : "#f87171"
      pts.push({ lat: c.lat, lng: c.lng, size: 0.45, color: col,
        label: `${FLAG[b.Country] ?? ""} ${b.Country} · ${b.Score_100.toFixed(1)}/100`,
        type: "buyer", buyerId: b.Buyer_ID })
    })
    approvedLeads.forEach(b => {
      const c = COORDS[b.Country]
      if (!c) return
      pts.push({ lat: c.lat, lng: c.lng, size: 0.5, color: "#10b981",
        label: `✓ ${b.Country} · Approved`,
        type: "approved" })
    })
    return pts
  }, [buyers, approvedLeads])

  // Arcs: India → each approved country
  const arcs = useMemo(() => {
    return approvedLeads.map(b => {
      const c = COORDS[b.Country]
      if (!c) return null
      return {
        startLat: 20.59, startLng: 78.96,
        endLat: c.lat, endLng: c.lng,
        color: ["rgba(16,185,129,0.8)", "rgba(16,185,129,0.1)"],
        arcAltitude: 0.25,
      }
    }).filter(Boolean)
  }, [approvedLeads])

  // Rings: pulse on buyer locations
  const rings = useMemo(() => {
    return buyers.map(b => {
      const c = COORDS[b.Country]
      if (!c) return null
      return {
        lat: c.lat, lng: c.lng,
        maxR: 3, propagationSpeed: 2, repeatPeriod: 1200,
        color: () => b.Score_100 >= 70 ? "rgba(34,211,238,0.4)" : "rgba(245,158,11,0.4)",
      }
    }).filter(Boolean)
  }, [buyers])

  useEffect(() => {
    if (!globeRef.current || !globeReady) return
    // Point camera at India on load
    globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 3.5 }, 1200)
    // Slow auto-rotate
    globeRef.current.controls().autoRotate = true
    globeRef.current.controls().autoRotateSpeed = 0.35
    globeRef.current.controls().enableZoom = false
  }, [globeReady])

  // Tilt to approved country on first approval
  useEffect(() => {
    if (!globeRef.current || !globeReady || approvedLeads.length === 0) return
    const last = approvedLeads[approvedLeads.length - 1]
    const c = COORDS[last.Country]
    if (c) globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 2.8 }, 800)
  }, [approvedLeads.length])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        width={undefined}
        height={undefined}
        backgroundColor="rgba(0,0,0,0)"

        // ── Globe appearance ──────────────────────────────────────────
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.18}

        // ── Points ────────────────────────────────────────────────────
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude={0.01}
        pointLabel="label"

        // ── Arcs (approved trade routes) ──────────────────────────────
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude="arcAltitude"
        arcStroke={0.5}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={2000}

        // ── Rings (buyer pulse) ───────────────────────────────────────
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        ringAltitude={0.005}
      />
    </div>
  )
}

// ── Swipeable Buyer Card ──────────────────────────────────────────────────────
function SwipeCard({ buyer, onSwipe, isTop }: {
  buyer: Buyer; onSwipe: (dir: "left" | "right") => void; isTop: boolean
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const cardOpacity = useTransform(x, [-250, 0, 250], [0, 1, 0])
  const approveOpacity = useTransform(x, [20, 100], [0, 1])
  const rejectOpacity  = useTransform(x, [-100, -20], [1, 0])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 90) {
      animate(x, 700, { duration: 0.28 }).then(() => onSwipe("right"))
    } else if (info.offset.x < -90) {
      animate(x, -700, { duration: 0.28 }).then(() => onSwipe("left"))
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 })
    }
  }

  const s = buyer.Score_100
  const scoreColor = s >= 70 ? "#10b981" : s >= 45 ? "#f59e0b" : "#ef4444"

  const dims = [
    { label: "Product",     val: buyer.D1, locked: true  },
    { label: "Geography",   val: buyer.D2, locked: true  },
    { label: "Capacity",    val: buyer.D3, locked: true  },
    { label: "Intent",      val: buyer.D4, locked: false },
    { label: "Reliability", val: buyer.D5, locked: false },
  ]

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity, position: "absolute", width: "100%", zIndex: isTop ? 10 : 5 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileTap={isTop ? { cursor: "grabbing" } : {}}
    >
      {isTop && (
        <>
          <motion.div style={{ opacity: approveOpacity }}
            className="absolute top-5 left-5 z-20 bg-emerald-500 text-white font-black text-base px-4 py-1.5 rounded-xl border-2 border-emerald-300"
            style={{ opacity: approveOpacity, rotate: "-12deg" }}>
            APPROVE ✓
          </motion.div>
          <motion.div
            className="absolute top-5 right-5 z-20 bg-red-500 text-white font-black text-base px-4 py-1.5 rounded-xl border-2 border-red-300"
            style={{ opacity: rejectOpacity, rotate: "12deg" }}>
            REJECT ✕
          </motion.div>
        </>
      )}

      <div className="rounded-2xl overflow-hidden shadow-2xl mx-auto" 
        style={{ maxWidth: 360, background: "linear-gradient(145deg,#162440,#0f1e38)", border: "1px solid rgba(255,255,255,0.18)" }}>

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">{buyer.Buyer_ID}</p>
              <h2 className="text-2xl font-black text-white mt-0.5 truncate">
                {FLAG[buyer.Country] ?? ""} {buyer.Country}
              </h2>
              <p className="text-slate-400 text-sm mt-1 truncate">{buyer.Industry}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border font-bold
                  ${buyer.Match_Type === "Primary"
                    ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10"
                    : "border-violet-500/50 text-violet-400 bg-violet-500/10"}`}>
                  {buyer.Match_Type}
                </span>
              </p>
              <p className="text-slate-400 text-[11px] mt-1">via {buyer.Preferred_Channel}</p>
            </div>

            <div className="relative w-18 h-18 flex-shrink-0" style={{ width: 72, height: 72 }}>
              <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                <circle cx="36" cy="36" r="28" fill="none"
                  stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(s / 100) * 175.9} 175.9`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-black text-lg leading-none">{s.toFixed(0)}</span>
                <span className="text-slate-700 text-[9px]">/100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border
            ${buyer.Risk_Label === "Low"        ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
            : buyer.Risk_Label === "Medium"     ? "text-amber-400   border-amber-500/40   bg-amber-500/10"
            : buyer.Risk_Label === "High"       ? "text-orange-400  border-orange-500/40  bg-orange-500/10"
            :                                     "text-red-400     border-red-500/40     bg-red-500/10"}`}>
            {buyer.Risk_Label} Risk · −{(buyer.Risk_Friction * 100).toFixed(1)}pts
          </span>
        </div>

        <div className="mx-5 border-t border-white/5 mb-3"/>

        <div className="px-5 pb-4 space-y-2">
          {dims.map(d => (
            <div key={d.label} className="flex items-center gap-2.5">
              <span className="text-[9px] text-slate-600 w-20 shrink-0 flex items-center gap-1">
                {d.locked && <span className="text-[8px]">🔒</span>}{d.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.val * 100}%`, background: d.locked ? "#2d5a8e" : "#06b6d4" }}/>
              </div>
              <span className="text-[9px] text-slate-500 w-7 text-right font-mono">{(d.val * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>

        {isTop && (
          <div className="px-5 pb-4 flex justify-between text-[9px] text-slate-500">
            <span>← reject</span><span>approve →</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Weight Mini Panel ─────────────────────────────────────────────────────────
function WeightStrip({ weights }: { weights: any }) {
  const dims = [
    { k: "D1_Product_Compat",  l: "D1", locked: true  },
    { k: "D2_Geography_Fit",   l: "D2", locked: true  },
    { k: "D3_Trade_Capacity",  l: "D3", locked: true  },
    { k: "D4_Intent_Activity", l: "D4", locked: false },
    { k: "D5_Reliability",     l: "D5", locked: false },
  ]
  return (
    <div className="rounded-xl border border-white/8 bg-[#0b1120] px-4 py-3 space-y-1.5">
      <p className="text-[9px] text-slate-600 font-semibold tracking-widest mb-2">ADAPTIVE WEIGHTS</p>
      {dims.map(d => (
        <div key={d.k} className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 w-20 shrink-0 flex items-center gap-1">
            {d.locked && <span className="text-slate-700 text-[8px]">🔒</span>}{d.l}
          </span>
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${weights[d.k] * 100}%`, background: d.locked ? "#2d5a8e" : "#06b6d4" }}/>
          </div>
          <span className="text-[9px] text-slate-500 w-6 text-right font-mono">{(weights[d.k] * 100).toFixed(0)}%</span>
        </div>
      ))}
      <p className="text-[8px] text-slate-700 pt-1">🔒 Locked · Cyan adapts from approvals</p>
    </div>
  )
}

// ── Main SplitGlobePage ───────────────────────────────────────────────────────
export default function SplitGlobePage({ onAction, onLoad }: Props) {
  const {
    loading, error, exporter, buyers, leads, weights,
    pool, round, init, nextBatch, submitFeedback,
  } = useScoreEngine()

  const [deck, setDeck]         = useState<Buyer[]>([])
  const [accepted, setAccepted] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const [roundDone, setRoundDone] = useState(false)

  useEffect(() => { init("EXP_1715") }, [])

  useEffect(() => {
    if (buyers.length > 0) {
      setDeck([...buyers].reverse()) // reverse so last = top card
      setAccepted([]); setRejected([])
      setRoundDone(false)
      onLoad(buyers.length)
    }
  }, [buyers])

  const handleSwipe = useCallback((buyer: Buyer, dir: "left" | "right") => {
    onAction(dir === "right" ? "approve" : "reject")
    if (dir === "right") setAccepted(p => [...p, buyer.Buyer_ID])
    else setRejected(p => [...p, buyer.Buyer_ID])
    setDeck(prev => {
      const next = prev.slice(0, -1)
      if (next.length === 0) setRoundDone(true)
      return next
    })
  }, [onAction])

  const handleNextRound = async () => {
    await submitFeedback(accepted, rejected)
    setRoundDone(false); setAccepted([]); setRejected([])
    await nextBatch()
  }

  const handleSubmitOnly = async () => {
    await submitFeedback(accepted, rejected)
  }

  if (loading && !exporter) return (
    <div className="flex items-center justify-center h-full" style={{ background: "#060d1a" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-slate-400 text-sm">Loading score engine…</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-full" style={{ background: "#060d1a" }}>

      {/* ── LEFT: 3D Globe — 50% ───────────────────────────────────── */}
      <div className="w-1/2 flex flex-col p-4 gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-semibold tracking-widest">TRADE MAP</span>
          <div className="flex gap-3 text-[10px] text-slate-600">
            <span>Round <span className="text-white font-bold">{round}</span></span>
            <span>Pool <span className="text-white font-bold">{pool.toLocaleString()}</span></span>
            <span>Approved <span className="text-emerald-400 font-bold">{leads.length}</span></span>
          </div>
        </div>

        {/* Globe — fills all remaining space */}
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.06)", minHeight: 0 }}>
          <TradeGlobe buyers={deck} approvedLeads={leads} />
        </div>

        {weights && <WeightStrip weights={weights} />}
      </div>

      {/* ── RIGHT: Card stack — 50% ────────────────────────────────── */}
      <div className="w-1/2 shrink-0 flex flex-col items-center justify-center p-6 gap-5"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>

        {roundDone ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-5">
            <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111d35", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold text-white">Round {round} Complete</p>
              <div className="flex justify-center gap-8">
                <div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={20} className="text-emerald-400"/>
                  </div>
                  <p className="text-2xl font-black text-emerald-400">{accepted.length}</p>
                  <p className="text-[10px] text-slate-600">Approved</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-2">
                    <XCircle size={20} className="text-red-400"/>
                  </div>
                  <p className="text-2xl font-black text-red-400">{rejected.length}</p>
                  <p className="text-[10px] text-slate-600">Rejected</p>
                </div>
              </div>
              <p className="text-slate-500 text-xs">Rejected buyers re-enter pool with updated D4/D5 weights next round.</p>
            </div>
            <div className="space-y-2.5 w-full">
              <button onClick={handleNextRound} disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all"
                style={{ background: "#06b6d4", color: "#060d1a" }}>
                {loading ? "Scoring…" : "Next Round →"}
              </button>
              <button onClick={handleSubmitOnly} disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all text-emerald-400"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                View Approved Leads
              </button>
            </div>
          </motion.div>

        ) : deck.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Card stack */}
            <div className="relative w-full" style={{ height: 480 }}>
              {deck.length > 2 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: "scale(0.91) translateY(20px)", opacity: 0.25, zIndex: 1 }}>
                  <div className="w-full max-w-sm rounded-2xl" style={{ height: 380, background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.05)" }}/>
                </div>
              )}
              {deck.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: "scale(0.95) translateY(10px)", opacity: 0.5, zIndex: 2 }}>
                  <div className="w-full max-w-sm rounded-2xl" style={{ height: 380, background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.06)" }}/>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                <SwipeCard
                  key={deck[deck.length - 1]?.Buyer_ID}
                  buyer={deck[deck.length - 1]}
                  onSwipe={dir => handleSwipe(deck[deck.length - 1], dir)}
                  isTop={true}
                />
              </div>

              {/* Manual buttons */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6" style={{ zIndex: 20 }}>
                <button onClick={() => handleSwipe(deck[deck.length - 1], "left")}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
                  <XCircle size={24} className="text-red-400"/>
                </button>
                <button onClick={() => handleSwipe(deck[deck.length - 1], "right")}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)" }}>
                  <CheckCircle2 size={24} className="text-emerald-400"/>
                </button>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 items-center">
              {buyers.map((_, i) => {
                const done = i < buyers.length - deck.length
                return <div key={i} className="rounded-full transition-all duration-300"
                  style={{ width: done ? 16 : 6, height: 6, background: done ? "#06b6d4" : "rgba(255,255,255,0.12)" }}/>
              })}
            </div>
            <p className="text-[10px] text-slate-600">{buyers.length - deck.length} of {buyers.length} reviewed</p>
          </div>

        ) : (
          <div className="text-center space-y-4">
            {loading
              ? <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"/>
              : <Zap size={36} className="text-slate-700 mx-auto"/>}
            <p className="text-slate-500 text-sm">{loading ? "Scoring buyers…" : "All buyers reviewed"}</p>
            {error && <p className="text-red-400 text-xs rounded-lg px-3 py-2 max-w-xs" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
