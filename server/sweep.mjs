// server/sweep.mjs
// Sweep orchestrator: runs all sources in parallel, enriches, computes delta, emits SSE
import { fetchGDELT } from './sources/gdelt.mjs';
import { fetchReddit } from './sources/reddit.mjs';
import { fetchRSS } from './sources/rss.mjs';
import { fetchOpenSky } from './sources/opensky.mjs';
import { fetchNOAA } from './sources/noaa.mjs';
import { fetchCelesTrak } from './sources/celestrak.mjs';
import { fetchCrypto } from './sources/coingecko.mjs';
import { fetchYahooFinance } from './sources/yahoo.mjs';
import { fetchFRED } from './sources/fred.mjs';
import { fetchEIA } from './sources/eia.mjs';
import { fetchFIRMS } from './sources/firms.mjs';
import { enrichArticles, computeDelta, getSweepCount } from './delta.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'latest.json');

// SSE broadcast function — set from server.mjs
let _broadcast = () => {};
export function setBroadcast(fn) { _broadcast = fn; }

// Bot alert function — set from server.mjs / bots
let _onAlert = () => {};
export function setAlertHandler(fn) { _onAlert = fn; }

// Current state in memory
export let state = {
  articles: [],
  prices: { btc:{price:0,change24h:0}, eth:{price:0,change24h:0}, sol:{price:0,change24h:0},
            gold:{price:0,change24h:0}, silver:{price:24.5,change24h:1.2},
            oil:{price:0,change24h:0}, gas:{price:0,change24h:0},
            SP500:{price:0,change24h:0}, DXY:{price:0,change24h:0} },
  celestrak: { activeSatellites: 0, recentLaunches: 0 },
  delta: { flash:[], priority:[], routine:[], totalNew:0, sweepNumber:0 },
  lastSweep: null,
  sourceStatus: {},
};

async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
}

async function persistState() {
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('[Sweep] Failed to persist state:', err.message);
  }
}

export async function loadPersistedState() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const saved = JSON.parse(raw);
    if (saved.articles) state.articles = saved.articles;
    if (saved.prices) state.prices = saved.prices;
    if (saved.celestrak) state.celestrak = saved.celestrak;
    console.log(`[Sweep] Loaded ${state.articles.length} articles from persisted state`);
  } catch {
    console.log('[Sweep] No persisted state found, starting fresh');
  }
}

function isEnabled(key, defaultVal = true) {
  const v = process.env[key];
  if (v === undefined) return defaultVal;
  return v !== 'false' && v !== '0';
}

export async function runSweep() {
  const start = Date.now();
  console.log('[Sweep] Starting sweep...');
  const sourceStatus = {};

  // ── Run all article sources in parallel ────────────────────────────────────
  const sourceResults = await Promise.allSettled([
    isEnabled('ENABLE_GDELT') ? fetchGDELT() : Promise.resolve([]),
    isEnabled('ENABLE_REDDIT') ? fetchReddit() : Promise.resolve([]),
    fetchRSS(), // always on
    isEnabled('ENABLE_OPENSKY') ? fetchOpenSky() : Promise.resolve([]),
    isEnabled('ENABLE_NOAA') ? fetchNOAA() : Promise.resolve([]),
    isEnabled('ENABLE_FIRMS', false) ? fetchFIRMS() : Promise.resolve([]),
  ]);

  const sourceNames = ['gdelt','reddit','rss','opensky','noaa','firms'];
  const rawArticles = [];
  for (let i = 0; i < sourceResults.length; i++) {
    const r = sourceResults[i];
    const name = sourceNames[i];
    if (r.status === 'fulfilled') {
      rawArticles.push(...r.value);
      sourceStatus[name] = { ok: true, count: r.value.length };
    } else {
      sourceStatus[name] = { ok: false, error: r.reason?.message };
    }
  }

  // ── Run market sources in parallel ─────────────────────────────────────────
  const [cryptoR, yahooR, fredR, eiaR, celestrakR] = await Promise.allSettled([
    isEnabled('ENABLE_COINGECKO') ? fetchCrypto() : Promise.resolve(null),
    isEnabled('ENABLE_YAHOO') ? fetchYahooFinance() : Promise.resolve(null),
    fetchFRED(),
    fetchEIA(),
    isEnabled('ENABLE_CELESTRAK') ? fetchCelesTrak() : Promise.resolve(null),
  ]);

  // Merge market data with fallback chaining
  const prevPrices = state.prices;
  const crypto = cryptoR.status === 'fulfilled' ? cryptoR.value : null;
  const yahoo = yahooR.status === 'fulfilled' ? yahooR.value : null;
  const fred = fredR.status === 'fulfilled' ? fredR.value : null;
  const eia = eiaR.status === 'fulfilled' ? eiaR.value : null;

  state.prices = {
    btc:    crypto?.btc   ?? prevPrices.btc,
    eth:    crypto?.eth   ?? prevPrices.eth,
    sol:    crypto?.sol   ?? prevPrices.sol,
    gold:   fred?.gold    ?? yahoo?.GOLD_FUT  ?? prevPrices.gold,
    silver: prevPrices.silver, // no free real-time source
    oil:    eia?.oil      ?? yahoo?.OIL_WTI   ?? prevPrices.oil,
    gas:    eia?.gas      ?? yahoo?.NAT_GAS   ?? prevPrices.gas,
    SP500:  yahoo?.SP500  ?? prevPrices.SP500,
    DXY:    yahoo?.DXY    ?? prevPrices.DXY,
  };

  if (celestrakR.status === 'fulfilled' && celestrakR.value) {
    state.celestrak = celestrakR.value;
  }

  // Source status tracking
  ['coingecko','yahoo','fred','eia','celestrak'].forEach((n,i) => {
    const r = [cryptoR, yahooR, fredR, eiaR, celestrakR][i];
    sourceStatus[n] = { ok: r.status === 'fulfilled', count: r.value ? 1 : 0 };
  });

  // ── Enrich + deduplicate articles ──────────────────────────────────────────
  const enriched = enrichArticles(rawArticles);
  const delta = computeDelta(enriched);

  // Keep latest 500 articles in memory
  state.articles = enriched.slice(0, 500);
  state.delta = delta;
  state.lastSweep = new Date().toISOString();
  state.sourceStatus = sourceStatus;

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Sweep #${getSweepCount()}] Done in ${elapsed}s — ${enriched.length} articles, ${delta.totalNew} new, ${delta.flash.length} FLASH`);

  // ── Persist + broadcast ────────────────────────────────────────────────────
  await persistState();
  _broadcast({ type: 'sweep', data: state });
  if (delta.flash.length > 0 || delta.priority.length > 0) {
    _onAlert(delta);
  }

  return state;
}

export function startSweepCycle() {
  const intervalMin = parseInt(process.env.REFRESH_INTERVAL_MINUTES || '15', 10);
  const intervalMs = intervalMin * 60 * 1000;
  console.log(`[Sweep] Cycle started — interval: ${intervalMin}min`);

  // Run immediately, then on interval
  runSweep().catch(err => console.error('[Sweep] Initial sweep error:', err));
  return setInterval(() => {
    runSweep().catch(err => console.error('[Sweep] Sweep error:', err));
  }, intervalMs);
}
