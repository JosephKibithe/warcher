import type { Article } from "./api";

export interface SweepDelta {
  flash: Article[];    // HIGH priority new articles
  priority: Article[]; // MED priority new articles
  routine: Article[];  // LOW priority new articles
  totalNew: number;
  sweepNumber: number;
}

const SEEN_KEY = "warcher_seen_ids";
const SWEEP_COUNT_KEY = "warcher_sweep_count";

function getSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  try {
    // Keep only the last 2000 IDs to avoid bloating sessionStorage
    const arr = Array.from(ids);
    const trimmed = arr.slice(-2000);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function getSweepNumber(): number {
  try {
    return parseInt(sessionStorage.getItem(SWEEP_COUNT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementSweepNumber(): number {
  const next = getSweepNumber() + 1;
  try {
    sessionStorage.setItem(SWEEP_COUNT_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
}

/**
 * Computes which articles in the new batch are "new" (not seen before).
 * On the first sweep (sweep #1), all articles are marked as seen but no alerts
 * are fired — we need a baseline before we can compute deltas.
 */
export function computeSweepDelta(articles: Article[]): SweepDelta {
  const seenIds = getSeenIds();
  const sweepNumber = incrementSweepNumber();
  const isFirstSweep = sweepNumber === 1;

  const newArticles: Article[] = [];

  for (const article of articles) {
    if (!seenIds.has(article.id)) {
      newArticles.push(article);
      seenIds.add(article.id);
    }
  }

  // Persist updated seen set
  saveSeenIds(seenIds);

  // On first sweep, establish baseline — don't fire alerts
  if (isFirstSweep) {
    return {
      flash: [],
      priority: [],
      routine: [],
      totalNew: 0,
      sweepNumber,
    };
  }

  const flash = newArticles.filter((a) => a.priority === "HIGH");
  const priority = newArticles.filter((a) => a.priority === "MED");
  const routine = newArticles.filter((a) => a.priority === "LOW");

  return {
    flash,
    priority,
    routine,
    totalNew: newArticles.length,
    sweepNumber,
  };
}

/**
 * Reset sweep state (useful for testing or manual reset)
 */
export function resetSweep(): void {
  try {
    sessionStorage.removeItem(SEEN_KEY);
    sessionStorage.removeItem(SWEEP_COUNT_KEY);
  } catch {
    // ignore
  }
}
