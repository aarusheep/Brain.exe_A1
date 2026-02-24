/**
 * SwipePage.tsx  –  proexport-dashboard/src/pages/SwipePage.tsx
 *
 * FIX: Removed the useEffect that called startSession() on every mount.
 * useGlobex() handles mount logic internally — it checks /api/status first
 * and resumes the existing session. startSession() is only called explicitly
 * from the "No session" screen or the "Start Over" button.
 */

import React from 'react';
import SwipeCard from '@/components/SwipeCard';
import { useGlobex } from '@/hooks/useGlobex';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const DEFAULT_EXPORTER = 'EXP_1715';

export default function SwipePage() {
  const {
    exporter,
    buyers,
    currentBuyer,
    currentIndex,
    totalInBatch,
    round,
    weights,
    weightLog,
    poolRemaining,
    totalApproved,
    sessionDone,
    sessionReady,
    isLoading,
    error,
    startSession,
    swipeRight,
    swipeLeft,
    resetSession,
  } = useGlobex();
  // ↑ autoResume=true by default.
  // On mount it calls GET /api/status:
  //   • session exists on backend  → resumes, loads next unseen batch
  //   • no session                 → sets sessionReady=false, shows picker below

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !currentBuyer) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-bold tracking-wide">
            Scoring buyer pool…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF]">
        <div className="max-w-md text-center space-y-4 p-8">
          <XCircle className="mx-auto text-rose-500" size={48} />
          <p className="text-slate-800 font-black text-xl">API Error</p>
          <p className="text-slate-500 text-sm font-mono bg-slate-100 p-3 rounded-xl">
            {error}
          </p>
          <p className="text-slate-400 text-xs">
            Make sure Flask is running: <code>python api.py</code>
          </p>
          <button
            onClick={() => startSession(DEFAULT_EXPORTER)}
            className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black
                       hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── No session yet (first ever visit, or after reset) ─────────────────────
  if (!sessionReady && !isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF]">
        <div className="text-center space-y-6 p-8">
          <h2 className="text-slate-900 font-black text-3xl tracking-tighter">
            GlobexMatch
          </h2>
          <p className="text-slate-500 font-bold">
            No active session found.
          </p>
          <button
            onClick={() => startSession(DEFAULT_EXPORTER)}
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black
                       text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  // ── Session complete ──────────────────────────────────────────────────────
  if (sessionDone) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF]">
        <div className="max-w-md text-center space-y-5 p-8">
          <CheckCircle className="mx-auto text-emerald-500" size={56} />
          <h2 className="text-slate-900 font-black text-3xl tracking-tighter">
            Session Complete
          </h2>
          <p className="text-slate-500 font-bold">
            {totalApproved} buyers approved across {round} rounds.
          </p>
          <button
            onClick={resetSession}
            className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black
                       hover:bg-slate-700 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // ── Main swipe UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-10 py-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            GlobexMatch
          </h1>
          {exporter && (
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {exporter.id} · {exporter.industry} · {exporter.state}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          <Stat label="Round"    value={round} />
          <Stat label="In Batch" value={`${currentIndex + 1}/${totalInBatch}`} />
          <Stat label="Pool"     value={poolRemaining.toLocaleString()} />
          <Stat label="Approved" value={totalApproved} accent />
        </div>
      </header>

      {/* Card stack */}
      <main className="flex-1 flex items-center justify-center relative">
        {buyers.map((buyer, i) => {
          const stackIndex = i - currentIndex;
          if (stackIndex < 0 || stackIndex > 2) return null;
          return (
            <div
              key={buyer.id}
              style={{
                zIndex: buyers.length - stackIndex,
                transform: stackIndex === 0
                  ? 'none'
                  : `scale(${1 - stackIndex * 0.04}) translateY(${stackIndex * 18}px)`,
                transition: 'transform 0.3s ease',
              }}
              className="absolute"
            >
              <SwipeCard
                lead={buyer}
                isFront={stackIndex === 0}
                onSwipe={(dir) => dir === 'right' ? swipeRight() : swipeLeft()}
                currentIndex={currentIndex}
                totalLeads={totalInBatch}
              />
            </div>
          );
        })}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center
                          bg-[#F7F4EF]/70 z-50">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
          </div>
        )}
      </main>

      {/* Button controls */}
      <footer className="flex justify-center gap-6 pb-10 pt-4">
        <button
          onClick={swipeLeft}
          disabled={isLoading || !currentBuyer}
          className="w-16 h-16 rounded-full bg-white border-2 border-rose-200
                     text-rose-500 font-black text-2xl shadow-lg
                     hover:bg-rose-50 hover:border-rose-400 transition-all
                     disabled:opacity-30"
        >
          ✕
        </button>
        <button
          onClick={swipeRight}
          disabled={isLoading || !currentBuyer}
          className="w-16 h-16 rounded-full bg-emerald-500 text-white
                     font-black text-2xl shadow-lg shadow-emerald-500/30
                     hover:bg-emerald-600 transition-all disabled:opacity-30"
        >
          ✓
        </button>
      </footer>

      {/* Weight update toast */}
      {weightLog.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white
                        px-6 py-4 rounded-2xl shadow-2xl max-w-xs z-50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Weights Updated
          </p>
          {weightLog.map((entry) => (
            <div key={entry.Dimension} className="flex justify-between text-sm font-bold gap-4">
              <span className="text-slate-300">
                {entry.Dimension
                  .replace('D1_Product_Compat',  'Product')
                  .replace('D2_Geography_Fit',   'Geography')
                  .replace('D3_Trade_Capacity',  'Capacity')
                  .replace('D4_Intent_Activity', 'Intent')
                  .replace('D5_Reliability',     'Reliability')}
              </span>
              <span className={
                entry.Direction === 'INCREASE' ? 'text-emerald-400' :
                entry.Direction === 'DECREASE' ? 'text-rose-400' : 'text-slate-500'
              }>
                {entry.Direction === 'INCREASE' ? '↑' :
                 entry.Direction === 'DECREASE' ? '↓' : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: {
  label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p className={`text-lg font-black ${accent ? 'text-emerald-600' : 'text-slate-800'}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}
