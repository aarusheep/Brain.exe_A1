// hooks/useScoreEngineGlobal.ts
// Singleton store so ApproveLeads + ApprovedLeads share the same state.
// Usage: replace useScoreEngine import with useScoreEngineGlobal in both pages.

import { useEffect, useCallback } from "react"

type Listener = () => void
type Buyer = any
type Weights = any

interface State {
  loading: boolean; error: string | null
  exporter: any; buyers: Buyer[]; leads: Buyer[]
  weights: Weights | null; pool: number; round: number
  listeners: Set<Listener>
}

const S: State = {
  loading: false, error: null, exporter: null,
  buyers: [], leads: [], weights: null, pool: 0, round: 0,
  listeners: new Set(),
}

function notify() { S.listeners.forEach(fn => fn()) }
function set(patch: Partial<Omit<State,'listeners'>>) {
  Object.assign(S, patch); notify()
}

const API = "http://localhost:5050/api"
async function call(url: string, opts?: RequestInit) {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || "API error")
  return j
}

export async function engineInit(eid = "EXP_1715") {
  set({ loading: true, error: null })
  try {
    const d = await call(`${API}/init`, { method: "POST", body: JSON.stringify({ exporter_id: eid }) })
    set({ exporter: d.exporter, pool: d.pool_size })
    const b = await call(`${API}/buyers`)
    set({ buyers: b.buyers, round: b.round, pool: b.pool_remaining, weights: b.weights })
  } catch (e: any) { set({ error: e.message }) }
  finally { set({ loading: false }) }
}

export async function engineFeedback(accepted: string[], rejected: string[]) {
  set({ loading: true, error: null })
  try {
    const d = await call(`${API}/feedback`, {
      method: "POST", body: JSON.stringify({ accepted, rejected }),
    })
    set({ weights: d.weights, pool: d.pool_remaining })
    const ld = await call(`${API}/leads`)
    set({ leads: ld.leads, buyers: [] })
  } catch (e: any) { set({ error: e.message }) }
  finally { set({ loading: false }) }
}

export async function engineNextBatch() {
  set({ loading: true, error: null })
  try {
    const b = await call(`${API}/buyers`)
    set({ buyers: b.buyers, round: b.round, pool: b.pool_remaining, weights: b.weights })
  } catch (e: any) { set({ error: e.message }) }
  finally { set({ loading: false }) }
}

export async function engineRefreshLeads() {
  try { const ld = await call(`${API}/leads`); set({ leads: ld.leads }) }
  catch (e: any) { set({ error: e.message }) }
}

// React hook – subscribes to singleton store
export function useScoreEngineGlobal() {
  const [, forceRender] = (typeof window !== 'undefined')
    ? require('react').useReducer((x: number) => x + 1, 0)
    : [0, () => {}]

  useEffect(() => {
    S.listeners.add(forceRender)
    return () => { S.listeners.delete(forceRender) }
  }, [forceRender])

  return {
    loading: S.loading, error: S.error, exporter: S.exporter,
    buyers: S.buyers, leads: S.leads, weights: S.weights,
    pool: S.pool, round: S.round,
    init: engineInit, submitFeedback: engineFeedback,
    nextBatch: engineNextBatch, refreshLeads: engineRefreshLeads,
  }
}
