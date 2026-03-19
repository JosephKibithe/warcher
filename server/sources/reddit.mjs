// server/sources/reddit.mjs
// Reddit public JSON API — no key required
import fetch from 'node-fetch';

const SUBREDDITS = ['worldnews', 'geopolitics', 'MiddleEastNews', 'UkrainianConflict', 'GlobalPowers'];
const CONFLICT_KEYWORDS = [
  'israel','gaza','palestine','iran','iraq','syria','lebanon','yemen','houthi','hezbollah','hamas',
  'saudi','turkey','egypt','jordan','missile','strike','war','conflict','military','nuclear','drone',
  'ceasefire','peace','sanction','idf','irgc','centcom','tehran','baghdad','damascus','beirut',
  'cairo','riyadh','middle east','gulf','red sea','ukraine','kyiv','kharkiv','zaporizhzhia',
  'russia','nato','putin','zelensky','taiwan','beijing','china','north korea','pyongyang',
  'myanmar','kabul','afghanistan','pakistan','india','airspace','offensive','invasion',
  'casualties','killed','attack','explosion','troops','battalion','artillery','hypersonic',
];

export async function fetchReddit() {
  const articles = [];
  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'WARCHER-OSINT/2.0' },
        }
      );
      const json = await res.json();
      const posts = json?.data?.children || [];

      for (const { data: p } of posts) {
        if (!p || p.stickied || !p.title) continue;
        const lower = p.title.toLowerCase();
        if (!CONFLICT_KEYWORDS.some(kw => lower.includes(kw))) continue;

        articles.push({
          id: `reddit-${p.id}`,
          title: p.title,
          source: `r/${sub}`,
          link: p.url || `https://www.reddit.com${p.permalink}`,
          published: new Date(p.created_utc * 1000).toISOString(),
          sourceType: 'reddit',
        });
      }
    } catch (err) {
      console.warn(`[Reddit r/${sub}] failed:`, err.message);
    }
  }
  return articles;
}
