/**
 * useGlobex.js  –  proexport-dashboard/src/hooks/useGlobex.js
 *
 * On page reload:
 *   GET /api/status  →  if has_active_batch=true, use current_buyers directly.
 *   Only calls GET /api/buyers when starting a genuinely new batch
 *   (after feedback is submitted). This way round never increments on reload
 *   and the same cards are shown exactly where the user left off.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Globex from '@/lib/globex';

export function useGlobex(autoResume = true) {
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState(null);
  const [exporter,      setExporter]      = useState(null);
  const [buyers,        setBuyers]        = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [round,         setRound]         = useState(0);
  const [weights,       setWeights]       = useState(null);
  const [weightLog,     setWeightLog]     = useState([]);
  const [poolRemaining, setPoolRemaining] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [sessionDone,   setSessionDone]   = useState(false);
  const [sessionReady,  setSessionReady]  = useState(false);

  const acceptedIds = useRef([]);
  const rejectedIds = useRef([]);

  const clearError = () => setError(null);

  // ── Set buyers from any source (status resume or fresh batch) ─────────────
  const applyBuyers = useCallback((buyerList) => {
    const mapped = buyerList.map(Globex.mapBuyerToLead);
    if (!mapped || mapped.length === 0) {
      setSessionDone(true);
      setBuyers([]);
      return;
    }
    setBuyers(mapped);
    setCurrentIndex(0);
    acceptedIds.current = [];
    rejectedIds.current = [];
  }, []);

  // ── Load a fresh scored batch from /api/buyers ────────────────────────────
  const loadBatch = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const result = await Globex.getBuyers();
      setRound(result.round);
      setWeights(result.weights);
      setPoolRemaining(result.poolRemaining);
      applyBuyers(result.buyers);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [applyBuyers]);

  // ── Flush decisions → update weights → load next batch ───────────────────
  const flushAndNextBatch = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const result = await Globex.sendFeedback(
        acceptedIds.current,
        rejectedIds.current,
      );
      setWeights(result.weights);
      setWeightLog(result.weightLog);
      setPoolRemaining(result.poolRemaining);
      setTotalApproved(result.totalApproved);
      await loadBatch();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [loadBatch]);

  // ── Advance to next card ──────────────────────────────────────────────────
  const advance = useCallback(async () => {
    const next = currentIndex + 1;
    if (next < buyers.length) {
      setCurrentIndex(next);
    } else {
      await flushAndNextBatch();
    }
  }, [currentIndex, buyers.length, flushAndNextBatch]);

  // ── Auto-resume on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!autoResume) return;
    (async () => {
      setIsLoading(true);
      clearError();
      try {
        const status = await Globex.getStatus();

        if (status.ready) {
          // Restore metadata
          setRound(status.round ?? 0);
          setWeights(status.weights ?? null);
          setPoolRemaining(status.pool_remaining ?? 0);
          setTotalApproved(status.total_approved ?? 0);
          if (status.exporter) setExporter(status.exporter);
          setSessionReady(true);

          if (status.has_active_batch && status.current_buyers?.length > 0) {
            // Resume mid-batch — use the buyers from status directly.
            // Do NOT call /api/buyers (would increment round + repeat cards).
            applyBuyers(status.current_buyers);
          } else {
            // Batch was completed before reload — load the next one
            await loadBatch();
          }
        } else {
          setSessionReady(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public API ────────────────────────────────────────────────────────────

  /** Start a brand-new session. Only call from picker / Start Over button. */
  const startSession = useCallback(async (exporterId) => {
    setIsLoading(true);
    clearError();
    setSessionDone(false);
    setTotalApproved(0);
    setWeightLog([]);
    setBuyers([]);
    setCurrentIndex(0);
    try {
      const result = await Globex.init(exporterId);
      setExporter(result.exporter);
      setPoolRemaining(result.poolSize);
      setSessionReady(true);
      await loadBatch();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [loadBatch]);

  const swipeRight = useCallback(async () => {
    const buyer = buyers[currentIndex];
    if (!buyer) return;
    acceptedIds.current.push(buyer.Buyer_ID || buyer.id);
    await advance();
  }, [buyers, currentIndex, advance]);

  const swipeLeft = useCallback(async () => {
    const buyer = buyers[currentIndex];
    if (!buyer) return;
    rejectedIds.current.push(buyer.Buyer_ID || buyer.id);
    await advance();
  }, [buyers, currentIndex, advance]);

  const resetSession = useCallback(async () => {
    await Globex.reset();
    setBuyers([]);
    setCurrentIndex(0);
    setRound(0);
    setWeights(null);
    setWeightLog([]);
    setPoolRemaining(0);
    setTotalApproved(0);
    setSessionDone(false);
    setSessionReady(false);
    setExporter(null);
    acceptedIds.current = [];
    rejectedIds.current = [];
  }, []);

  return {
    exporter, buyers,
    currentBuyer:  buyers[currentIndex] || null,
    currentIndex,
    totalInBatch:  buyers.length,
    round, weights, weightLog, poolRemaining, totalApproved,
    sessionDone, sessionReady, isLoading, error,
    startSession, swipeRight, swipeLeft, resetSession,
  };
}