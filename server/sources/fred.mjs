// server/sources/fred.mjs
// FRED API (St. Louis Federal Reserve) — requires FRED_API_KEY
import fetch from 'node-fetch';

export async function fetchFRED() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    // Gold: London AM fix (USD/troy oz) — GOLDAMGBD228NLBM
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=GOLDAMGBD228NLBM&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter(o => o.value !== '.');
    const current = parseFloat(obs[0]?.value ?? '0');
    const prev = parseFloat(obs[1]?.value ?? current.toString());
    const change = prev !== 0 ? ((current - prev) / prev) * 100 : 0;
    return { gold: { price: current, change24h: change } };
  } catch (err) {
    console.warn('[FRED] fetch failed:', err.message);
    return null;
  }
}
