// src/hooks/useSweepFeed.ts
// React hook — consumes SSE stream and backend state
import { useState, useEffect, useCallback } from 'react';
import { connectSweepFeed, fetchInitialData, type BackendState } from '../services/sse';
import { computeSweepDelta, type SweepDelta } from '../services/sweep';
import type { Article, PriceData, EscalationDataPoint } from '../services/api';
import { generateEscalationHistory } from '../services/api';

interface SweepFeedState {
  articles: Article[];
  prices: PriceData | null;
  escalationData: EscalationDataPoint[];
  delta: SweepDelta | null;
  sweepNumber: number;
  nextSweepIn: number;
  loading: boolean;
  connected: boolean;
  lastUpdate: Date;
  sourceStatus: Record<string, { ok: boolean; count?: number }>;
}

const SWEEP_INTERVAL_MS = parseInt(
  typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_REFRESH_INTERVAL_MS || '900000') : '900000',
  10
);

export function useSweepFeed(): SweepFeedState {
  const [articles, setArticles] = useState<Article[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [escalationData, setEscalationData] = useState<EscalationDataPoint[]>([]);
  const [delta, setDelta] = useState<SweepDelta | null>(null);
  const [sweepNumber, setSweepNumber] = useState(0);
  const [nextSweepIn, setNextSweepIn] = useState(SWEEP_INTERVAL_MS);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sourceStatus, setSourceStatus] = useState<Record<string, { ok: boolean; count?: number }>>({});

  const applyState = useCallback((backendState: BackendState) => {
    const arts = backendState.articles || [];
    setArticles(arts);
    setPrices(backendState.prices as PriceData);
    setEscalationData(generateEscalationHistory(arts));
    setLastUpdate(new Date());
    setSweepNumber(backendState.delta?.sweepNumber ?? 0);
    setSourceStatus(backendState.sourceStatus || {});
    setLoading(false);

    const d = computeSweepDelta(arts);
    setDelta(d);
    setNextSweepIn(SWEEP_INTERVAL_MS);
  }, []);

  useEffect(() => {
    // Hydrate immediately from REST
    fetchInitialData().then(data => {
      if (data) applyState(data);
    });

    // Connect to SSE
    const cleanup = connectSweepFeed(
      (payload) => {
        if (payload.type === 'init' || payload.type === 'sweep') {
          applyState(payload.data);
        }
      },
      setConnected
    );

    return cleanup;
  }, [applyState]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      setNextSweepIn(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return { articles, prices, escalationData, delta, sweepNumber, nextSweepIn, loading, connected, lastUpdate, sourceStatus };
}
