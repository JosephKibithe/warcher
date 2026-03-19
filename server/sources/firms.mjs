// server/sources/firms.mjs
// NASA FIRMS (Fire Information for Resource Management System)
// Requires FIRMS_MAP_KEY — register free at https://firms.modaps.eosdis.nasa.gov/api/area/
import fetch from 'node-fetch';

// Watch areas: focus on conflict zones
const WATCH_AREAS = [
  { area: '34,30,57,38', label: 'Middle East', dayRange: 1 },
  { area: '30,45,40,52', label: 'Ukraine', dayRange: 1 },
  { area: '36,10,55,18', label: 'Horn of Africa', dayRange: 1 },
];

export async function fetchFIRMS() {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) return [];

  const articles = [];
  for (const { area, label, dayRange } of WATCH_AREAS) {
    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${area}/${dayRange}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      const lines = text.split('\n').filter((l, i) => i > 0 && l.trim()); // skip header
      const count = lines.length;

      if (count > 5) { // only report if notable fire activity
        articles.push({
          id: `firms-${label.replace(/\s/g, '')}-${dayRange}d-${Date.now()}`,
          title: `NASA FIRMS: ${count} thermal anomalies detected in ${label} (last ${dayRange}d)`,
          source: 'NASA FIRMS',
          link: 'https://firms.modaps.eosdis.nasa.gov',
          published: new Date().toISOString(),
          sourceType: 'firms',
        });
      }
    } catch (err) {
      console.warn(`[FIRMS ${label}] failed:`, err.message);
    }
  }
  return articles;
}
