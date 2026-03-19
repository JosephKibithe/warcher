// server/sources/celestrak.mjs
// CelesTrak — free satellite/space object data, no key required
import fetch from 'node-fetch';

const GP_URL = 'https://celestrak.org/SOCRATES/query.php'; // unused for now — use catalog count instead

// Fetch active satellite count from CelesTrak's active satellite catalog
export async function fetchCelesTrak() {
  try {
    // Active satellites: returns TLE data, we just count them for the space watch gauge
    const res = await fetch('https://celestrak.org/SATCAT/query.php?STATUS=active&FORMAT=json', {
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    const count = Array.isArray(json) ? json.length : 0;

    // Also check for recent launches (objects with INTLDES from current year)
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const recentLaunches = Array.isArray(json)
      ? json.filter(s => s.INTLDES?.startsWith(currentYear)).length
      : 0;

    return {
      activeSatellites: count,
      recentLaunches,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[CelesTrak] fetch failed:', err.message);
    return { activeSatellites: 0, recentLaunches: 0, timestamp: new Date().toISOString() };
  }
}
