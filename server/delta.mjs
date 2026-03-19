// server/delta.mjs
// Computes deltas between sweeps and tiers alerts

// In-memory hot set of seen article IDs (persistent across sweeps, resets on restart)
let previousIds = new Set();
let sweepCount = 0;

export const ALERT_TIERS = { FLASH: 'FLASH', PRIORITY: 'PRIORITY', ROUTINE: 'ROUTINE' };

// Category + priority classification (mirrors frontend logic on the server)
const CATEGORY_KEYWORDS = {
  NUCLEAR: ['nuclear','uranium','enrichment','warhead','icbm','plutonium','atomic','jcpoa','radiological'],
  CYBER: ['cyberattack','cyber attack','hacker','ransomware','malware','breach','espionage','disinformation'],
  SANCTIONS: ['sanction','embargo','blacklist','ofac','tariff','trade restriction','export control'],
  ECON: ['economy','gdp','inflation','central bank','federal reserve','interest rate','oil price','energy crisis'],
  MILITARY: ['idf','army','military','soldier','tank','drone','aircraft','navy','force','defense','weapon'],
  DIPLOMATIC: ['talks','negotiation','diplomat','embassy','summit','agreement','treaty','peace','ceasefire'],
  PROXY: ['houthi','hezbollah','hamas','militia','proxy','terrorist','insurgent','rebel'],
  CONFLICT: ['strike','attack','war','bomb','missile','rocket','casualt','kill','death','fight','battle','clash','offensive','invasion'],
};

const HIGH_PRIORITY_KEYWORDS = ['breaking','urgent','killed','death','strike','attack','war','invasion','nuclear','missile','flash','urgent'];

export function categorize(title) {
  const lower = title.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) return cat;
  }
  return 'CONFLICT';
}

export function prioritize(title) {
  const lower = title.toLowerCase();
  if (HIGH_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) return 'HIGH';
  return 'MED';
}

const LOCATION_MAP = {
  tehran:{lat:35.6892,lng:51.389},gaza:{lat:31.5017,lng:34.4668},
  beirut:{lat:33.8938,lng:35.5018},damascus:{lat:33.5138,lng:36.2765},
  baghdad:{lat:33.3152,lng:44.3661},riyadh:{lat:24.7136,lng:46.6753},
  cairo:{lat:30.0444,lng:31.2357},jerusalem:{lat:31.7683,lng:35.2137},
  'tel aviv':{lat:32.0853,lng:34.7818},sanaa:{lat:15.3694,lng:44.191},
  tripoli:{lat:32.8872,lng:13.1913},aden:{lat:12.7855,lng:45.0186},
  khartoum:{lat:15.5007,lng:32.5599},mogadishu:{lat:2.0469,lng:45.3182},
  kyiv:{lat:50.4501,lng:30.5234},kharkiv:{lat:49.9935,lng:36.2304},
  donetsk:{lat:48.015,lng:37.8028},crimea:{lat:45.3375,lng:34.1212},
  moscow:{lat:55.7558,lng:37.6173},ukraine:{lat:49.0275,lng:31.4828},
  taiwan:{lat:23.6978,lng:120.9605},taipei:{lat:25.033,lng:121.5654},
  beijing:{lat:39.9042,lng:116.4074},pyongyang:{lat:39.0392,lng:125.7625},
  kabul:{lat:34.5553,lng:69.2075},islamabad:{lat:33.6844,lng:73.0479},
  bamako:{lat:12.6392,lng:-8.0029},niamey:{lat:13.5137,lng:2.1098},
  israel:{lat:31.0461,lng:34.8516},iran:{lat:32.4279,lng:53.688},
  syria:{lat:34.8021,lng:38.9968},iraq:{lat:33.2232,lng:43.6793},
  yemen:{lat:15.5527,lng:48.5164},sudan:{lat:15.5007,lng:32.5599},
  'south china sea':{lat:15.0,lng:115.0},'taiwan strait':{lat:24.5,lng:119.5},
};

export function extractLocation(title) {
  const lower = title.toLowerCase();
  for (const [name, coords] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(name)) {
      return { ...coords, name: name.charAt(0).toUpperCase() + name.slice(1) };
    }
  }
  return undefined;
}

/**
 * Enrich raw articles from sources with category, priority, location, corroboration
 */
export function enrichArticles(rawArticles) {
  // Deduplicate by id
  const seen = new Set();
  const unique = rawArticles.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort newest first
  unique.sort((a, b) => new Date(b.published) - new Date(a.published));

  // Enrich
  const enriched = unique.map(a => ({
    ...a,
    category: categorize(a.title),
    priority: prioritize(a.title),
    location: extractLocation(a.title),
    corroborated: false,
  }));

  // Cross-source corroboration: 3+ distinct sources → same location in 90 min
  const WINDOW = 90 * 60 * 1000;
  const locSources = {};
  const now = Date.now();
  for (const a of enriched) {
    if (!a.location) continue;
    const loc = a.location.name.toLowerCase();
    const age = now - new Date(a.published).getTime();
    if (age > WINDOW) continue;
    if (!locSources[loc]) locSources[loc] = { sources: new Set(), ids: new Set() };
    locSources[loc].sources.add(a.source);
    locSources[loc].ids.add(a.id);
  }
  const corroboratedIds = new Set();
  for (const { sources, ids } of Object.values(locSources)) {
    if (sources.size >= 3) ids.forEach(id => corroboratedIds.add(id));
  }

  return enriched.map(a => ({ ...a, corroborated: corroboratedIds.has(a.id) }));
}

/**
 * Compute delta between current sweep articles and the previously seen set.
 * Returns SweepDelta object consumed by SSE and bots.
 */
export function computeDelta(articles) {
  sweepCount++;
  const isFirst = sweepCount === 1;

  const newArticles = articles.filter(a => !previousIds.has(a.id));
  articles.forEach(a => previousIds.add(a.id));

  // Keep hot set manageable
  if (previousIds.size > 5000) {
    const arr = [...previousIds];
    previousIds = new Set(arr.slice(-4000));
  }

  if (isFirst) {
    return { flash: [], priority: [], routine: [], totalNew: 0, sweepNumber: sweepCount };
  }

  // Cap FLASH at 5 per sweep to avoid spam
  const flash = newArticles.filter(a => a.priority === 'HIGH').slice(0, 5);
  const priority = newArticles.filter(a => a.priority === 'MED').slice(0, 10);
  const routine = newArticles.filter(a => a.priority === 'LOW').slice(0, 10);

  return { flash, priority, routine, totalNew: newArticles.length, sweepNumber: sweepCount };
}

export function getSweepCount() { return sweepCount; }
