// hooks/useScoreEngine.ts  →  src/hooks/useScoreEngine.ts
import { useState, useCallback } from "react"

const API = "http://localhost:5050/api"

export interface Buyer {
  Buyer_ID: string
  Country: string
  Industry: string
  Preferred_Channel: string
  Match_Type: "Primary" | "Adjacent"
  Final_Score: number
  Score_100: number
  Risk_Label: "Low" | "Medium" | "High" | "Very High"
  Risk_Friction: number
  D1: number; D2: number; D3: number; D4: number; D5: number
  lat: number; lng: number
  accepted_round?: number
  Revenue_Size_USD?: number
}

export interface Weights {
  D1_Product_Compat: number; D2_Geography_Fit: number
  D3_Trade_Capacity: number; D4_Intent_Activity: number; D5_Reliability: number
}

export interface Exporter { id: string; industry: string; state: string; cert: string }

async function call(url: string, opts?: RequestInit) {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || "API error")
  return j
}

export function useScoreEngine() {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [exporter, setExporter] = useState<Exporter | null>(null)
  const [buyers, setBuyers]     = useState<Buyer[]>([])
  const [leads, setLeads]       = useState<Buyer[]>([])
  const [weights, setWeights]   = useState<Weights | null>(null)
  const [pool, setPool]         = useState(0)
  const [round, setRound]       = useState(0)

  const init = useCallback(async (eid = "EXP_1715") => {
    setLoading(true); setError(null)
    try {
      const d = await call(`${API}/init`, { method: "POST", body: JSON.stringify({ exporter_id: eid }) })
      setExporter(d.exporter); setPool(d.pool_size)
      // auto-fetch first batch
      const b = await call(`${API}/buyers`)
      setBuyers(b.buyers); setRound(b.round); setPool(b.pool_remaining); setWeights(b.weights)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const nextBatch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const b = await call(`${API}/buyers`)
      setBuyers(b.buyers); setRound(b.round); setPool(b.pool_remaining); setWeights(b.weights)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const submitFeedback = useCallback(async (accepted: string[], rejected: string[]) => {
    setLoading(true); setError(null)
    try {
      const d = await call(`${API}/feedback`, {
        method: "POST",
        body: JSON.stringify({ accepted, rejected }),
      })
      setWeights(d.weights); setPool(d.pool_remaining)
      // refresh leads
      const ld = await call(`${API}/leads`)
      setLeads(ld.leads)
      setBuyers([])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const refreshLeads = useCallback(async () => {
    try { const ld = await call(`${API}/leads`); setLeads(ld.leads) }
    catch (e: any) { setError(e.message) }
  }, [])

  const reset = useCallback(async () => {
    await call(`${API}/reset`, { method: "POST" })
    setExporter(null); setBuyers([]); setLeads([]); setWeights(null)
    setRound(0); setPool(0)
  }, [])

  return { loading, error, exporter, buyers, leads, weights, pool, round, init, nextBatch, submitFeedback, refreshLeads, reset }
}
