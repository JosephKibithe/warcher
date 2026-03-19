// server/sources/opensky.mjs
// OpenSky Network — anonymous access, no key required
// Fetches military/interesting aircraft over conflict regions
import fetch from 'node-fetch';

// Watch boxes: [minLat, maxLat, minLon, maxLon, label]
const WATCH_BOXES = [
  [29, 38, 34, 57, 'Middle East'],
  [45, 55, 22, 40, 'Ukraine'],
  [22, 28, 120, 126, 'Taiwan Strait'],
  [36, 42, 24, 30, 'Eastern Mediterranean'],
  [10, 18, 40, 55, 'Red Sea / Horn of Africa'],
];

export async function fetchOpenSky() {
  const signals = [];
  for (const [minLat, maxLat, minLon, maxLon, label] of WATCH_BOXES) {
    try {
      const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      const states = json?.states || [];
      const count = states.length;

      if (count > 0) {
        signals.push({
          id: `opensky-${label.replace(/\s/g, '-').toLowerCase()}-${Date.now()}`,
          title: `OpenSky: ${count} aircraft tracked over ${label}`,
          source: 'OpenSky Network',
          link: 'https://opensky-network.org',
          published: new Date().toISOString(),
          sourceType: 'opensky',
          location: label,
          meta: { count, region: label },
        });
      }
    } catch (err) {
      console.warn(`[OpenSky ${label}] failed:`, err.message);
    }
  }
  return signals;
}
