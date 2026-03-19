// src/services/sse.ts
// SSE client wrapper — connects to backend /events stream

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3117';

export type SweepEventType = 'init' | 'sweep';

export interface SweepPayload {
  type: SweepEventType;
  data: BackendState;
}

export interface BackendState {
  articles: import('./api').Article[];
  prices: import('./api').PriceData & {
    SP500?: { price: number; change24h: number };
    DXY?: { price: number; change24h: number };
  };
  celestrak: { activeSatellites: number; recentLaunches: number };
  delta: {
    flash: import('./api').Article[];
    priority: import('./api').Article[];
    routine: import('./api').Article[];
    totalNew: number;
    sweepNumber: number;
  };
  lastSweep: string | null;
  sourceStatus: Record<string, { ok: boolean; count?: number; error?: string }>;
}

export function connectSweepFeed(
  onEvent: (payload: SweepPayload) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let es: EventSource | null = null;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function connect() {
    if (destroyed) return;
    es = new EventSource(`${BACKEND_URL}/events`);

    es.onopen = () => {
      onStatusChange?.(true);
    };

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as SweepPayload;
        onEvent(payload);
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      onStatusChange?.(false);
      es?.close();
      es = null;
      if (!destroyed) {
        retryTimeout = setTimeout(connect, 5000); // reconnect after 5s
      }
    };
  }

  connect();

  // Cleanup function
  return () => {
    destroyed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    es?.close();
  };
}

export async function fetchInitialData(): Promise<BackendState | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as BackendState;
  } catch (err) {
    console.warn('[SSE] Failed to fetch initial data:', err);
    return null;
  }
}
