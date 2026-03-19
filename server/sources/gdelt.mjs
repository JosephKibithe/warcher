// server/sources/gdelt.mjs
// GDELT 2.0 Doc API — free, no key required
import fetch from 'node-fetch';

const QUERY = encodeURIComponent(
  '(war OR conflict OR strike OR attack OR military OR nuclear OR sanction OR cyberattack OR drone OR missile)'
);
const URL = `https://api.gdeltproject.org/api/v2/doc/doc?query=${QUERY}&mode=artlist&maxrecords=25&format=json&sort=DateDesc&timespan=6h`;

export async function fetchGDELT() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    const items = json?.articles || [];

    return items
      .filter(a => a.url && a.title && (!a.language || a.language === 'English'))
      .map(a => ({
        id: `gdelt-${Buffer.from(a.url).toString('base64').substring(0, 12)}`,
        title: a.title,
        source: a.domain || 'GDELT',
        link: a.url,
        published: parseGDELTDate(a.seendate),
        sourceType: 'gdelt',
      }));
  } catch (err) {
    console.warn('[GDELT] fetch failed:', err.message);
    return [];
  }
}

function parseGDELTDate(s) {
  if (!s) return new Date().toISOString();
  const d = new Date(s.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
