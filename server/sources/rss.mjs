// server/sources/rss.mjs
// RSS feeds via rss2json API — mirrors the frontend feed list on the backend
import fetch from 'node-fetch';

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FEEDS = [
  // Major International
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', source: 'NYT Middle East' },
  { url: 'http://rss.cnn.com/rss/edition_meast.rss', source: 'CNN Middle East' },
  { url: 'https://www.theguardian.com/world/middleeast/rss', source: 'Guardian ME' },
  { url: 'https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml', source: 'UN News' },
  { url: 'https://www.defenseone.com/rss/all/', source: 'Defense One' },
  { url: 'https://rsshub.app/reuters/world', source: 'Reuters World' },
  // Regional
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
  { url: 'https://www.jpost.com/rss/rssfeedid_7', source: 'Jerusalem Post' },
  { url: 'https://www.timesofisrael.com/feed/', source: 'Times of Israel' },
  { url: 'https://english.alarabiya.net/feed/news', source: 'Al Arabiya' },
  { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye' },
  { url: 'https://www.aa.com.tr/en/rss/default?cat=middle-east', source: 'Anadolu Agency' },
  // Telegram via RSSHub
  { url: 'https://rsshub.app/telegram/channel/Middle_East_Spectator', source: 'ME Spectator (TG)' },
  { url: 'https://rsshub.app/telegram/channel/warmonitors', source: 'War Monitors (TG)' },
  { url: 'https://rsshub.app/telegram/channel/Faytuks', source: 'Faytuks (TG)' },
  { url: 'https://rsshub.app/telegram/channel/BellumActaNews', source: 'Bellum Acta (TG)' },
];

const CONFLICT_KEYWORDS = [
  'israel','gaza','palestine','iran','iraq','syria','lebanon','yemen','houthi',
  'hezbollah','hamas','saudi','turkey','egypt','missile','strike','war','conflict',
  'military','nuclear','drone','ceasefire','idf','irgc','ukraine','kyiv','russia',
  'nato','taiwan','beijing','china','north korea','troops','attack','bomb','explosion',
  'sanction','cyberattack','offensive','invasion',
];

export async function fetchRSS() {
  const articles = [];
  const BATCH = 4;

  for (let i = 0; i < FEEDS.length; i += BATCH) {
    const batch = FEEDS.slice(i, i + BATCH);
    await Promise.all(batch.map(async feed => {
      try {
        const cb = Math.floor(Date.now() / (1000 * 60 * 15)); // 15-min cache bust
        const res = await fetch(
          `${RSS2JSON}${encodeURIComponent(feed.url + '?_cb=' + cb)}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const json = await res.json();
        const items = json?.items || [];

        for (const item of items.slice(0, 12)) {
          const title = item.title || '';
          const link = item.link || '';
          if (!title || !link) continue;

          const lower = title.toLowerCase() + ' ' + (item.description || '').toLowerCase();
          if (!CONFLICT_KEYWORDS.some(kw => lower.includes(kw))) continue;

          const published = item.pubDate ? new Date(item.pubDate).toISOString() : new Date(0).toISOString();
          articles.push({
            id: `rss-${Buffer.from(link).toString('base64').substring(0, 12)}`,
            title,
            source: feed.source,
            link,
            published,
            sourceType: 'rss',
          });
        }
      } catch (err) {
        console.warn(`[RSS ${feed.source}] failed:`, err.message);
      }
    }));

    if (i + BATCH < FEEDS.length) {
      await new Promise(r => setTimeout(r, 800));
    }
  }
  return articles;
}
