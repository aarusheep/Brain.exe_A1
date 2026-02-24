/**
 * useGlobex.js  –  proexport-dashboard/src/hooks/useGlobex.js
 *
 * Fix: When navigating away and back (e.g. to Approved Leads page),
 * the hook restores the exact batch + card index from sessionStorage
 * instead of re-fetching from the backend. No round increment, no repeats.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Globex from '@/lib/globex';

const SS_KEY = 'globex_swipe_state'; // sessionStorage key

function saveFrontendState(buyers, currentIndex, round, weights, poolRemaining, totalApproved) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({
      buyers, currentIndex, round, weights, poolRemaining, totalApproved,
    }));
  } catch (_) {}
}

function loadFrontendState() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearFrontendState() {
  try { sessionStorage.removeItem(SS_KEY); } catch (_) {}
}

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

  // Save frontend state to sessionStorage whenever key values change
  // so navigation away and back restores the exact spot
  useEffect(() => {
    if (buyers.length > 0) {
      saveFrontendState(buyers, currentIndex, round, weights, poolRemaining, totalApproved);
    }
  }, [buyers, currentIndex, round, weights, poolRemaining, totalApproved]);

  // ── Apply a buyer list ─────────────────────────────────────────────────────
  const applyBuyers = useCallback((buyerList, startIndex = 0) => {
    const mapped = buyerList.map
      ? buyerList[0]?.Buyer_ID !== undefined
        ? buyerList.map(Globex.mapBuyerToLead)  // raw from backend
        : buyerList                               // already mapped
      : [];

    if (!mapped || mapped.length === 0) {
      setSessionDone(true);
      setBuyers([]);
      return;
    }
    setBuyers(mapped);
    setCurrentIndex(startIndex);
    acceptedIds.current = [];
    rejectedIds.current = [];
  }, []);

  // ── Load a fresh scored batch ─────────────────────────────────────────────
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
      clearFrontendState(); // batch done — clear so next mount loads fresh
      await loadBatch();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [loadBatch]);

  // ── Advance card ──────────────────────────────────────────────────────────
  const advance = useCallback(async () => {
    const next = currentIndex + 1;
    if (next < buyers.length) {
      setCurrentIndex(next);
    } else {
      await flushAndNextBatch();
    }
  }, [currentIndex, buyers.length, flushAndNextBatch]);

  // ── Mount: restore from sessionStorage first, then backend ───────────────
  useEffect(() => {
    if (!autoResume) return;
    (async () => {
      setIsLoading(true);
      clearError();
      try {
        // Step 1: Check sessionStorage — fastest path, survives navigation
        const cached = loadFrontendState();
        if (cached && cached.buyers?.length > 0) {
          // Restore exactly where the user was — same batch, same card index
          setBuyers(cached.buyers);
          setCurrentIndex(cached.currentIndex ?? 0);
          setRound(cached.round ?? 0);
          setWeights(cached.weights ?? null);
          setPoolRemaining(cached.poolRemaining ?? 0);
          setTotalApproved(cached.totalApproved ?? 0);
          setSessionReady(true);
          setIsLoading(false);

          // Also quietly sync exporter info from backend status
          Globex.getStatus().then(s => {
            if (s?.exporter) setExporter(s.exporter);
          }).catch(() => {});
          return;
        }

        // Step 2: Nothing in sessionStorage — check backend
        const status = await Globex.getStatus();
        if (status.ready) {
          setRound(status.round ?? 0);
          setWeights(status.weights ?? null);
          setPoolRemaining(status.pool_remaining ?? 0);
          setTotalApproved(status.total_approved ?? 0);
          if (status.exporter) setExporter(status.exporter);
          setSessionReady(true);

          if (status.has_active_batch && status.current_buyers?.length > 0) {
            applyBuyers(status.current_buyers);
          } else {
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

  const startSession = useCallback(async (exporterId) => {
    setIsLoading(true);
    clearError();
    clearFrontendState();
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
    clearFrontendState();
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














