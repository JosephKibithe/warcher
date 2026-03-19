// server/sources/noaa.mjs
// NOAA/NWS Active Alerts API — free, no key required
// Fetches active weather emergencies that may indicate geopolitical stress zones
import fetch from 'node-fetch';

const NOAA_URL = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert&urgency=Immediate,Expected&severity=Extreme,Severe&limit=25';

export async function fetchNOAA() {
  try {
    const res = await fetch(NOAA_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'WARCHER-OSINT/2.0 (contact@warcher.io)' },
    });
    const json = await res.json();
    const features = json?.features || [];

    return features.slice(0, 10).map(f => ({
      id: `noaa-${f.id?.replace(/[^a-z0-9]/gi, '').substring(0, 16) || Math.random().toString(36).slice(2)}`,
      title: `NOAA ALERT: ${f.properties?.event || 'Weather Emergency'} — ${f.properties?.areaDesc?.substring(0, 60) || 'USA'}`,
      source: 'NOAA/NWS',
      link: f.properties?.web || 'https://alerts.weather.gov',
      published: f.properties?.sent || new Date().toISOString(),
      sourceType: 'noaa',
    }));
  } catch (err) {
    console.warn('[NOAA] fetch failed:', err.message);
    return [];
  }
}
