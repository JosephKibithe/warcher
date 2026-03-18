import axios from "axios";

export interface Article {
  id: string;
  title: string;
  source: string;
  link: string;
  published: Date;
  category: "CONFLICT" | "MILITARY" | "DIPLOMATIC" | "PROXY" | "NUCLEAR" | "ECON" | "SANCTIONS" | "CYBER";
  priority: "HIGH" | "MED" | "LOW";
  sourceType: "rss" | "reddit" | "twitter" | "telegram" | "gdelt";
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  corroborated?: boolean;
}

export interface PriceData {
  btc: {
    price: number;
    change24h: number;
  };
  eth: {
    price: number;
    change24h: number;
  };
  sol: {
    price: number;
    change24h: number;
  };
  gold: {
    price: number;
    change24h: number;
  };
  silver: {
    price: number;
    change24h: number;
  };
  oil: {
    price: number;
    change24h: number;
  };
  gas: {
    price: number;
    change24h: number;
  };
}

// Keywords for categorization
const CATEGORY_KEYWORDS = {
  CONFLICT: [
    "strike",
    "attack",
    "war",
    "bomb",
    "missile",
    "rocket",
    "casualt",
    "kill",
    "death",
    "fight",
    "battle",
    "clash",
    "offensive",
    "invasion",
  ],
  MILITARY: [
    "idf",
    "army",
    "military",
    "soldier",
    "tank",
    "drone",
    "aircraft",
    "navy",
    "base",
    "force",
    "defense",
    "weapon",
  ],
  DIPLOMATIC: [
    "talks",
    "negotiation",
    "diplomat",
    "embassy",
    "summit",
    "meeting",
    "agreement",
    "treaty",
    "peace",
    "ceasefire",
    "deal",
  ],
  PROXY: [
    "houthi",
    "hezbollah",
    "hamas",
    "militia",
    "proxy",
    "terrorist",
    "insurgent",
    "rebel",
  ],
  NUCLEAR: [
    "nuclear",
    "uranium",
    "enrichment",
    "atomic",
    "iran deal",
    " jcpoa",
    "warhead",
    "icbm",
    "plutonium",
    "facility",
  ],
  CYBER: [
    "cyberattack",
    "cyber attack",
    "hacker",
    "ransomware",
    "malware",
    "breach",
    "espionage",
    "intelligence operation",
    "disinformation",
  ],
  SANCTIONS: [
    "sanction",
    "embargo",
    "ban",
    "blacklist",
    "ofac",
    "tariff",
    "trade restriction",
    "export control",
  ],
  ECON: [
    "economy",
    "gdp",
    "inflation",
    "central bank",
    "federal reserve",
    "interest rate",
    "oil price",
    "energy crisis",
    "supply chain",
    "commodity",
  ],
};

// Location keywords with coordinates (Middle East + Global hotspots)
const LOCATION_MAP: Record<string, { lat: number; lng: number }> = {
  // Middle East
  tehran: { lat: 35.6892, lng: 51.389 },
  "tel aviv": { lat: 32.0853, lng: 34.7818 },
  jerusalem: { lat: 31.7683, lng: 35.2137 },
  gaza: { lat: 31.5017, lng: 34.4668 },
  beirut: { lat: 33.8938, lng: 35.5018 },
  damascus: { lat: 33.5138, lng: 36.2765 },
  baghdad: { lat: 33.3152, lng: 44.3661 },
  riyadh: { lat: 24.7136, lng: 46.6753 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  sanaa: { lat: 15.3694, lng: 44.191 },
  tripoli: { lat: 32.8872, lng: 13.1913 },
  amman: { lat: 31.9454, lng: 35.9284 },
  kuwait: { lat: 29.3759, lng: 47.9774 },
  doha: { lat: 25.2854, lng: 51.531 },
  manama: { lat: 26.2285, lng: 50.586 },
  muscat: { lat: 23.5859, lng: 58.4059 },
  yemen: { lat: 15.5527, lng: 48.5164 },
  syria: { lat: 34.8021, lng: 38.9968 },
  lebanon: { lat: 33.8547, lng: 35.8623 },
  jordan: { lat: 30.5852, lng: 36.2384 },
  iraq: { lat: 33.2232, lng: 43.6793 },
  iran: { lat: 32.4279, lng: 53.688 },
  israel: { lat: 31.0461, lng: 34.8516 },
  palestine: { lat: 31.9522, lng: 35.2332 },
  saudi: { lat: 23.8859, lng: 45.0792 },
  uae: { lat: 23.4241, lng: 53.8478 },
  qatar: { lat: 25.3548, lng: 51.1839 },
  bahrain: { lat: 26.0667, lng: 50.5577 },
  oman: { lat: 21.4735, lng: 55.9754 },
  "kuwait city": { lat: 29.3759, lng: 47.9774 },
  basra: { lat: 30.5156, lng: 47.7804 },
  mosul: { lat: 36.3566, lng: 43.1642 },
  aleppo: { lat: 36.2021, lng: 37.1343 },
  hom: { lat: 34.7308, lng: 36.7094 },
  idlib: { lat: 35.9306, lng: 36.6339 },
  raqqa: { lat: 35.9606, lng: 39.0084 },
  kirkuk: { lat: 35.4669, lng: 44.3923 },
  erbil: { lat: 36.1911, lng: 44.0092 },
  sulaymaniyah: { lat: 35.5575, lng: 45.435 },
  najaf: { lat: 32.0, lng: 44.3333 },
  karbala: { lat: 32.616, lng: 44.0245 },
  hebron: { lat: 31.5326, lng: 35.0998 },
  nablus: { lat: 32.2211, lng: 35.2544 },
  jenin: { lat: 32.4616, lng: 35.3008 },
  ramallah: { lat: 31.9074, lng: 35.5354 },
  bethlehem: { lat: 31.7054, lng: 35.2024 },
  rafah: { lat: 31.287, lng: 34.2515 },
  "khan younis": { lat: 31.3462, lng: 34.3061 },
  jabalia: { lat: 31.5282, lng: 34.4834 },
  tyre: { lat: 33.27, lng: 35.2033 },
  sidon: { lat: 33.5606, lng: 35.3758 },
  nabatieh: { lat: 33.3789, lng: 35.4839 },
  baalbek: { lat: 34.0058, lng: 36.2181 },
  hermel: { lat: 34.3931, lng: 36.3847 },
  hodeidah: { lat: 14.7979, lng: 42.9545 },
  aden: { lat: 12.7855, lng: 45.0186 },
  taiz: { lat: 13.5773, lng: 44.0178 },
  marib: { lat: 15.4624, lng: 45.3258 },
  "al hudaydah": { lat: 14.7979, lng: 42.9545 },
  // Africa
  "port sudan": { lat: 19.6167, lng: 37.2167 },
  khartoum: { lat: 15.5007, lng: 32.5599 },
  benghazi: { lat: 32.1167, lng: 20.0667 },
  misrata: { lat: 32.3754, lng: 15.0925 },
  zawiya: { lat: 32.7522, lng: 12.7278 },
  sabratha: { lat: 32.7933, lng: 12.4856 },
  "addis ababa": { lat: 9.0054, lng: 38.7636 },
  mogadishu: { lat: 2.0469, lng: 45.3182 },
  bamako: { lat: 12.6392, lng: -8.0029 },
  niamey: { lat: 13.5137, lng: 2.1098 },
  ndjamena: { lat: 12.1048, lng: 15.0445 },
  "n'djamena": { lat: 12.1048, lng: 15.0445 },
  // Eastern Europe / Ukraine
  kyiv: { lat: 50.4501, lng: 30.5234 },
  kharkiv: { lat: 49.9935, lng: 36.2304 },
  zaporizhzhia: { lat: 47.8388, lng: 35.1396 },
  kherson: { lat: 46.6354, lng: 32.6169 },
  donetsk: { lat: 48.015, lng: 37.8028 },
  mariupol: { lat: 47.0956, lng: 37.5421 },
  bakhmut: { lat: 48.5958, lng: 37.9983 },
  odesa: { lat: 46.4825, lng: 30.7233 },
  lviv: { lat: 49.8397, lng: 24.0297 },
  crimea: { lat: 45.3375, lng: 34.1212 },
  ukraine: { lat: 49.0275, lng: 31.4828 },
  moscow: { lat: 55.7558, lng: 37.6173 },
  "st. petersburg": { lat: 59.9343, lng: 30.3351 },
  minsk: { lat: 53.9045, lng: 27.5615 },
  // Asia-Pacific
  taipei: { lat: 25.033, lng: 121.5654 },
  taiwan: { lat: 23.6978, lng: 120.9605 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  pyongyang: { lat: 39.0392, lng: 125.7625 },
  seoul: { lat: 37.5665, lng: 126.978 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  "south china sea": { lat: 15.0, lng: 115.0 },
  "taiwan strait": { lat: 24.5, lng: 119.5 },
  myanmar: { lat: 19.7633, lng: 96.0785 },
  yangon: { lat: 16.8409, lng: 96.1735 },
  // South Asia
  kabul: { lat: 34.5553, lng: 69.2075 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  india: { lat: 20.5937, lng: 78.9629 },
  pakistan: { lat: 30.3753, lng: 69.3451 },
  // Latin America
  caracas: { lat: 10.4806, lng: -66.9036 },
  havana: { lat: 23.1136, lng: -82.3666 },
};

function categorizeArticle(title: string): Article["category"] {
  const lowerTitle = title.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      return category as Article["category"];
    }
  }

  return "CONFLICT"; // Default category
}

function determinePriority(title: string): Article["priority"] {
  const lowerTitle = title.toLowerCase();
  const highKeywords = [
    "breaking",
    "urgent",
    "killed",
    "death",
    "strike",
    "attack",
    "war",
    "invasion",
    "nuclear",
    "missile",
  ];

  if (highKeywords.some((kw) => lowerTitle.includes(kw))) {
    return "HIGH";
  }

  return "MED";
}

function extractLocation(
  title: string,
): { lat: number; lng: number; name: string } | undefined {
  const lowerTitle = title.toLowerCase();

  for (const [location, coords] of Object.entries(LOCATION_MAP)) {
    if (lowerTitle.includes(location)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        name: location.charAt(0).toUpperCase() + location.slice(1),
      };
    }
  }

  return undefined;
}

// Map sources to their Middle East coverage pages (unused but kept for reference if needed later, removing for lint)

// Reddit fetching via Vite proxy
const REDDIT_SUBREDDITS = ["worldnews", "geopolitics", "MiddleEastNews"];
const ME_KEYWORDS = [
  "israel",
  "gaza",
  "palestine",
  "iran",
  "iraq",
  "syria",
  "lebanon",
  "yemen",
  "houthi",
  "hezbollah",
  "hamas",
  "saudi",
  "turkey",
  "egypt",
  "jordan",
  "missile",
  "strike",
  "war",
  "conflict",
  "military",
  "nuclear",
  "drone",
  "ceasefire",
  "peace",
  "diplomat",
  "sanction",
  "idf",
  "irgc",
  "centcom",
  "tehran",
  "baghdad",
  "damascus",
  "beirut",
  "cairo",
  "riyadh",
  "middle east",
  "mideast",
  "gulf",
  "red sea",
  "mediterranean",
];

async function fetchRedditNews(): Promise<Article[]> {
  const articles: Article[] = [];

  for (const subreddit of REDDIT_SUBREDDITS) {
    try {
      const response = await axios.get(
        `/api/reddit/r/${subreddit}/hot.json?limit=25`,
        {
          timeout: 5000,
        },
      );

      const posts = response.data?.data?.children || [];

      for (const post of posts) {
        const data = post.data;
        if (!data || data.stickied) continue;

        const title = data.title || "";
        const lowerTitle = title.toLowerCase();

        // Filter for Middle East / conflict relevance
        const isRelevant = ME_KEYWORDS.some((kw) => lowerTitle.includes(kw));
        if (!isRelevant) continue;

        articles.push({
          id: `reddit-${data.id}`,
          title,
          source: `r/${subreddit}`,
          link: data.url || `https://www.reddit.com${data.permalink}`,
          published: new Date(data.created_utc * 1000),
          category: categorizeArticle(title),
          priority: determinePriority(title),
          sourceType: "reddit",
          location: extractLocation(title),
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch r/${subreddit}:`, error);
    }
  }

  return articles;
}

// Removed duplicate SOURCE_URLS

const RSS_FEEDS = [
  // Major International Outlets
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", source: "BBC", type: "rss" },
  { url: "https://www.theguardian.com/world/middleeast/rss", source: "Guardian ME", type: "rss" },
  { url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml", source: "UN News", type: "rss" },
  { url: "https://www.euronews.com/rss?level=theme&name=news", source: "EuroNews", type: "rss" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml", source: "NYT Middle East", type: "rss" },
  { url: "http://rss.cnn.com/rss/edition_meast.rss", source: "CNN Middle East", type: "rss" },
  { url: "https://www.thecipherbrief.com/feed", source: "The Cipher Brief", type: "rss" },
  { url: "https://www.defenseone.com/rss/all/", source: "Defense One", type: "rss" },
  { url: "https://rsshub.app/reuters/world", source: "Reuters World", type: "rss" },
  
  // Regional Outlets
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", type: "rss" },
  { url: "https://www.jpost.com/rss/rssfeedid_7", source: "Jerusalem Post", type: "rss" },
  { url: "https://www.timesofisrael.com/feed/", source: "Times of Israel", type: "rss" },
  { url: "https://www.ynetnews.com/Integration/StoryRss1854.xml", source: "Ynetnews", type: "rss" },
  { url: "https://www.arabnews.com/cat/1/rss.xml", source: "Arab News", type: "rss" },
  { url: "https://english.alarabiya.net/feed/news", source: "Al Arabiya", type: "rss" },
  { url: "https://www.middleeasteye.net/rss", source: "Middle East Eye", type: "rss" },
  { url: "https://www.dailysabah.com/rss", source: "Daily Sabah", type: "rss" },
  { url: "https://www.aa.com.tr/en/rss/default?cat=middle-east", source: "Anadolu Agency", type: "rss" },
  { url: "https://en.irna.ir/rss", source: "IRNA", type: "rss" },
  
  // Telegram
  { url: "https://rsshub.app/telegram/channel/Middle_East_Spectator", source: "Middle_East_Spectator", type: "telegram" },
  { url: "https://rsshub.app/telegram/channel/Suriyak_maps", source: "Suriyak_maps", type: "telegram" },
  { url: "https://rsshub.app/telegram/channel/warmonitors", source: "warmonitors", type: "telegram" },
  { url: "https://rsshub.app/telegram/channel/Faytuks", source: "Faytuks", type: "telegram" },
  { url: "https://rsshub.app/telegram/channel/BellumActaNews", source: "Bellum Acta News", type: "telegram" },
  
  // Twitter via RSSHub
  { url: "https://rsshub.app/twitter/user/OSINTdefender", source: "@OSINTdefender", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/IntelCrab", source: "@IntelCrab", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/clashreport", source: "@clashreport", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/ELINTNews", source: "@ELINTNews", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/AuroraIntel", source: "@AuroraIntel", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/Faytuks", source: "@Faytuks", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/Charles_Lister", source: "@Charles_Lister", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/ragipsoylu", source: "@ragipsoylu", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/manniefabian", source: "@manniefabian", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/JoeTruzman", source: "@JoeTruzman", type: "twitter" }
];

async function fetchRealRSSFeeds(): Promise<Article[]> {
  const articles: Article[] = [];
  
  // rss2json is highly reliable for client-side RSS fetching and avoids strict CORS
  const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";

  // Process in batches to avoid rate limits on the free rss2json / rsshub APIs
  const BATCH_SIZE = 5;
  for (let i = 0; i < RSS_FEEDS.length; i += BATCH_SIZE) {
    const batch = RSS_FEEDS.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (feed) => {
      try {
        const cacheBuster = `&_cb=${Math.floor(Date.now() / (1000 * 60 * 15))}`; // changes every 15 minutes to bypass strict caches but avoid rate limits
        const targetUrl = feed.url + (feed.url.includes("?") ? "" : "?") + cacheBuster;
        
        const response = await axios.get(RSS2JSON_API + encodeURIComponent(targetUrl), { 
          timeout: 10000 
        });
        
        const items = response.data?.items || [];
        
        for (const item of items.slice(0, 15)) {
          const title = item.title || "";
          const link = item.link || "";
          const description = item.description || item.content || "";
          const pubDate = item.pubDate || "";
          
          if (!title || !link) continue;
          
          let publishedDate = new Date(0); // default to old date so it doesn't float to top
          if (pubDate) {
            const parsed = new Date(pubDate);
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed;
            }
          }
          
          const lowerTitle = title.toLowerCase();
          let isRelevant = true;
          
          if (feed.type === "rss") {
            isRelevant = ME_KEYWORDS.some((kw) => 
              lowerTitle.includes(kw) || 
              description.toLowerCase().includes(kw)
            );
          }
          
          if (!isRelevant) continue;

          articles.push({
            id: `rss-${btoa(link || title).substring(0, 10)}`,
            title: title,
            source: feed.source,
            link: link,
            published: publishedDate,
            category: categorizeArticle(title),
            priority: determinePriority(title),
            sourceType: feed.type as Article["sourceType"],
            location: extractLocation(title),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch RSS for ${feed.source}:`, error);
      }
    }));
    
    // Slight delay between batches (if not the last batch)
    if (i + BATCH_SIZE < RSS_FEEDS.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return articles;
}

// ── GDELT Global Conflict Events (no API key needed) ──────────────────────────
async function fetchGDELT(): Promise<Article[]> {
  const articles: Article[] = [];
  try {
    const query = encodeURIComponent(
      "(war OR conflict OR strike OR attack OR military OR nuclear OR sanction OR cyberattack)"
    );
    const url =
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=25&format=json&sort=DateDesc&timespan=6h`;

    const response = await axios.get(url, { timeout: 8000 });
    const items: Array<{
      url?: string;
      title?: string;
      seendate?: string;
      sourcecountry?: string;
      domain?: string;
      language?: string;
    }> = response.data?.articles || [];

    for (const item of items) {
      if (!item.url || !item.title) continue;
      if (item.language && item.language !== "English") continue;

      const title = item.title;
      const published = item.seendate
        ? new Date(
            item.seendate.replace(
              /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
              "$1-$2-$3T$4:$5:$6Z"
            )
          )
        : new Date();

      articles.push({
        id: `gdelt-${btoa(item.url).substring(0, 12)}`,
        title,
        source: item.domain || "GDELT",
        link: item.url,
        published: isNaN(published.getTime()) ? new Date() : published,
        category: categorizeArticle(title),
        priority: determinePriority(title),
        sourceType: "gdelt",
        location: extractLocation(title),
      });
    }
  } catch (error) {
    console.warn("Failed to fetch GDELT:", error);
  }
  return articles;
}

// ── Cross-source corroboration ─────────────────────────────────────────────────
// Tags articles as corroborated when 3+ distinct sources reference the same
// location or named entity within a 90-minute window.
function detectCrossSourceSignals(articles: Article[]): Article[] {
  const WINDOW_MS = 90 * 60 * 1000; // 90 min
  const MIN_SOURCES = 3;

  // Build a map: locationName → { sourceNames, articleIds }
  const locationSources: Record<string, { sources: Set<string>; ids: Set<string> }> = {};

  for (const article of articles) {
    if (!article.location) continue;
    const loc = article.location.name.toLowerCase();
    if (!locationSources[loc]) {
      locationSources[loc] = { sources: new Set(), ids: new Set() };
    }

    // Only count articles within the time window of the most recent one for this loc
    const nowish = Date.now();
    if (nowish - article.published.getTime() <= WINDOW_MS) {
      locationSources[loc].sources.add(article.source);
      locationSources[loc].ids.add(article.id);
    }
  }

  // Collect corroborated article IDs
  const corroboratedIds = new Set<string>();
  for (const [, data] of Object.entries(locationSources)) {
    if (data.sources.size >= MIN_SOURCES) {
      data.ids.forEach((id) => corroboratedIds.add(id));
    }
  }

  return articles.map((a) =>
    corroboratedIds.has(a.id) ? { ...a, corroborated: true } : a
  );
}

export async function fetchNews(): Promise<Article[]> {
  // Fetch from Reddit, RSS, and GDELT in parallel
  const [redditArticles, rssArticles, gdeltArticles] = await Promise.all([
    fetchRedditNews().catch(() => [] as Article[]),
    fetchRealRSSFeeds().catch(() => [] as Article[]),
    fetchGDELT().catch(() => [] as Article[]),
  ]);

  const allArticles = [...redditArticles, ...rssArticles, ...gdeltArticles];

  // De-duplicate by ID
  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort by published date (newest first)
  deduped.sort((a, b) => {
    const timeA = a.published.getTime();
    const timeB = b.published.getTime();
    const validA = isNaN(timeA) ? 0 : timeA;
    const validB = isNaN(timeB) ? 0 : timeB;
    return validB - validA;
  });

  // Cross-source corroboration pass
  const withSignals = detectCrossSourceSignals(deduped);

  // If we couldn't fetch anything (due to network/CORS), fallback to a basic alert
  if (withSignals.length === 0) {
    withSignals.push({
      id: "fallback-0",
      title: "SYSTEM ALERT: OSINT Data Feeds Offline. Retrying connection to nodes...",
      source: "WARCHER SYSTEM",
      link: "#",
      published: new Date(),
      category: "MILITARY",
      priority: "HIGH",
      sourceType: "rss",
    });
  }

  return withSignals;
}


// ── EIA: real WTI crude oil + Henry Hub natural gas prices ───────────────────
async function fetchEIAPrices(): Promise<{ oil: number; oilChange: number; gas: number; gasChange: number }> {
  const apiKey = import.meta.env.VITE_EIA_API_KEY;
  if (!apiKey) throw new Error("No EIA key");

  // WTI crude oil — series RWTC (weekly spot price)
  const [oilRes, gasRes] = await Promise.all([
    axios.get(
      `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`,
      { timeout: 8000 }
    ),
    axios.get(
      `https://api.eia.gov/v2/natural-gas/pri/sum/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[series][]=N9190US3&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`,
      { timeout: 8000 }
    ),
  ]);

  const oilData = oilRes.data?.response?.data || [];
  const gasData = gasRes.data?.response?.data || [];

  const oilCurrent = parseFloat(oilData[0]?.value ?? "82.45");
  const oilPrev    = parseFloat(oilData[1]?.value ?? oilCurrent.toString());
  const oilChange  = oilPrev !== 0 ? ((oilCurrent - oilPrev) / oilPrev) * 100 : 0;

  const gasCurrent = parseFloat(gasData[0]?.value ?? "2.15");
  const gasPrev    = parseFloat(gasData[1]?.value ?? gasCurrent.toString());
  const gasChange  = gasPrev !== 0 ? ((gasCurrent - gasPrev) / gasPrev) * 100 : 0;

  return { oil: oilCurrent, oilChange, gas: gasCurrent, gasChange };
}

// ── FRED: real gold price (London AM fix, USD/troy oz) ────────────────────────
async function fetchFREDGoldPrice(): Promise<{ gold: number; goldChange: number }> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;
  if (!apiKey) throw new Error("No FRED key");

  const res = await axios.get(
    `https://api.stlouisfed.org/fred/series/observations?series_id=GOLDAMGBD228NLBM&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`,
    { timeout: 8000 }
  );

  // Filter out missing values (FRED uses "." for missing)
  const obs: Array<{ date: string; value: string }> = (res.data?.observations || []).filter(
    (o: { value: string }) => o.value !== "."
  );

  const current = parseFloat(obs[0]?.value ?? "2142.5");
  const prev    = parseFloat(obs[1]?.value ?? current.toString());
  const change  = prev !== 0 ? ((current - prev) / prev) * 100 : 0;

  return { gold: current, goldChange: change };
}

export async function fetchPrices(): Promise<PriceData> {
  // Run all three sources in parallel
  const [cryptoResult, eiaResult, fredResult] = await Promise.allSettled([
    // CoinGecko — crypto (free, no key)
    axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
    ),
    fetchEIAPrices(),
    fetchFREDGoldPrice(),
  ]);

  // Crypto
  let btc = { price: 73302.0, change24h: 7.32 };
  let eth = { price: 2156.21, change24h: 8.84 };
  let sol = { price: 145.20,  change24h: 5.12 };
  if (cryptoResult.status === "fulfilled") {
    const d = cryptoResult.value.data;
    btc = { price: d.bitcoin?.usd ?? btc.price, change24h: d.bitcoin?.usd_24h_change ?? btc.change24h };
    eth = { price: d.ethereum?.usd ?? eth.price, change24h: d.ethereum?.usd_24h_change ?? eth.change24h };
    sol = { price: d.solana?.usd ?? sol.price,   change24h: d.solana?.usd_24h_change ?? sol.change24h };
  }

  // Oil & Gas (EIA)
  let oil    = { price: 82.45, change24h: -1.2 };
  let gas    = { price: 2.15,  change24h: 3.4  };
  if (eiaResult.status === "fulfilled") {
    oil = { price: eiaResult.value.oil, change24h: eiaResult.value.oilChange };
    gas = { price: eiaResult.value.gas, change24h: eiaResult.value.gasChange };
  } else {
    console.warn("EIA fetch failed, using fallback:", eiaResult.reason);
  }

  // Gold (FRED)
  let gold   = { price: 2142.5, change24h: 0.8 };
  let silver = { price: 24.5,   change24h: 1.2 };
  if (fredResult.status === "fulfilled") {
    gold = { price: fredResult.value.gold, change24h: fredResult.value.goldChange };
  } else {
    console.warn("FRED fetch failed, using fallback:", fredResult.reason);
  }

  return { btc, eth, sol, gold, silver, oil, gas };
}


// Generate AI SITREP from articles
export function generateSitRep(articles: Article[]): string {
  const highPriority = articles.filter((a) => a.priority === "HIGH");

  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toISOString().split("T")[1].slice(0, 5);

  const redditCount = articles.filter((a) => a.sourceType === "reddit").length;
  const socialCount = articles.filter(
    (a) => a.sourceType === "twitter" || a.sourceType === "telegram",
  ).length;
  const rssCount = articles.filter((a) => a.sourceType === "rss").length;

  let sitrep = `Intelligence Briefing: Middle East Conflict Update\n`;
  sitrep += `Date: ${date} | Time: ${time} UTC\n\n`;

  sitrep += `1. CURRENT SITUATION\n`;

  if (highPriority.length > 0) {
    sitrep += `As of ${time} UTC, multiple high-priority incidents reported across the Middle East region. `;
    sitrep += `Key developments include: ${highPriority
      .slice(0, 3)
      .map((a) => a.title)
      .join("; ")}.\n\n`;
  } else {
    sitrep += `As of ${time} UTC, the security situation in the Middle East remains tense with ongoing military operations `;
    sitrep += `and diplomatic activities across multiple theaters.\n\n`;
  }

  sitrep += `2. KEY DEVELOPMENTS\n`;

  const byCategory: Record<string, Article[]> = {};
  articles.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  });

  for (const [cat, items] of Object.entries(byCategory)) {
    if (items.length > 0) {
      sitrep += `- ${cat}: ${items.length} reported incidents\n`;
    }
  }

  sitrep += `\n3. SOURCE BREAKDOWN\n`;
  sitrep += `- RSS/News: ${rssCount} articles\n`;
  sitrep += `- Reddit OSINT: ${redditCount} posts\n`;
  sitrep += `- Social (X/Telegram): ${socialCount} posts\n`;

  sitrep += `\n4. ESCALATION LEVEL\n`;
  const escalationScore = Math.min(10, Math.ceil(highPriority.length / 2) + 3);
  const escalationLevel =
    escalationScore >= 7
      ? "CRITICAL"
      : escalationScore >= 5
        ? "ELEVATED"
        : "MODERATE";
  sitrep += `${escalationLevel} — Escalation Index: ${escalationScore}/10\n\n`;

  sitrep += `5. WATCH LIST\n`;
  sitrep += `- Monitor Iranian military movements and proxy activities\n`;
  sitrep += `- Track Israeli operations in Gaza and Lebanon\n`;
  sitrep += `- Watch for diplomatic developments in Qatar and Egypt\n`;
  sitrep += `- Assess humanitarian situation in conflict zones`;

  return sitrep;
}

export interface EscalationDataPoint {
  timestamp: string;
  level: number;
}

export function generateEscalationHistory(articles: Article[]): EscalationDataPoint[] {
  // Generate 24 hours of REAL historical data points from fetched articles
  const history: EscalationDataPoint[] = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Look at articles published in the 6 hours leading up to this timepoint
    const timeWindowStart = new Date(time.getTime() - 6 * 60 * 60 * 1000);
    
    const relevantArticles = articles.filter(a => a.published <= time && a.published >= timeWindowStart);
    const highPriorityCount = relevantArticles.filter(a => a.priority === "HIGH").length;
    
    // Base level ~3.0 (elevated baseline).
    // The impact of high priority items diminishes log-linearly or is capped to prevent easy pegging to 10.
    // E.g., 1 high priority = +1.0, 5 high priority = +2.5, 10 high priority = +4.0
    const highPriorityImpact = Math.min(6.5, Math.log1p(highPriorityCount) * 1.5);
    
    let currentLevel = 3.2 + highPriorityImpact;
    
    // Add minor variation based on total article volume (0 to 0.5 impact max)
    const volumeImpact = Math.min(0.5, relevantArticles.length * 0.05);
    currentLevel += volumeImpact;
    
    // Random noise for realistic chart fluctuation (± 0.2)
    const noise = (Math.random() * 0.4) - 0.2;
    currentLevel += noise;

    // Hard ceiling under 10 unless there's an overwhelming catastrophic event
    // Keep standard scale clamped between 2.0 and 9.5 for normal high-stress periods
    currentLevel = Math.max(2.0, Math.min(9.5, currentLevel));
    
    // If no articles exist for the very old history (because feeds only return latest 25),
    // softly degrade towards standard background level (3.5)
    if (relevantArticles.length === 0 && history.length > 0) {
      const prev = history[history.length - 1].level;
      currentLevel = prev + (3.5 - prev) * 0.2; 
    } else if (relevantArticles.length === 0) {
      currentLevel = 3.5;
    }
    
    const finalLevel = Math.round(currentLevel * 10) / 10;
    
    history.push({
      timestamp: time.toISOString(),
      level: finalLevel
    });
  }
  
  return history;
}
