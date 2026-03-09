import axios from "axios";

export interface Article {
  id: string;
  title: string;
  source: string;
  link: string;
  published: Date;
  category: "CONFLICT" | "MILITARY" | "DIPLOMATIC" | "PROXY" | "NUCLEAR";
  priority: "HIGH" | "MED" | "LOW";
  sourceType: "rss" | "reddit" | "twitter" | "telegram";
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
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
  gold: {
    price: number;
    change24h: number;
  };
  oil: {
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
    "facility",
  ],
};

// Location keywords with coordinates
const LOCATION_MAP: Record<string, { lat: number; lng: number }> = {
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
  "port sudan": { lat: 19.6167, lng: 37.2167 },
  khartoum: { lat: 15.5007, lng: 32.5599 },
  benghazi: { lat: 32.1167, lng: 20.0667 },
  misrata: { lat: 32.3754, lng: 15.0925 },
  zawiya: { lat: 32.7522, lng: 12.7278 },
  sabratha: { lat: 32.7933, lng: 12.4856 },
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
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", source: "BBC", type: "rss" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", type: "rss" },
  { url: "https://www.jpost.com/rss/rssfeedid_7", source: "Jerusalem Post", type: "rss" },
  // WorldMonitor additions
  { url: "https://www.theguardian.com/world/middleeast/rss", source: "Guardian ME", type: "rss" },
  { url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml", source: "UN News", type: "rss" },
  { url: "https://www.euronews.com/rss?level=theme&name=news", source: "EuroNews", type: "rss" },
  // Telegram
  { url: "https://rsshub.app/telegram/channel/Middle_East_Spectator", source: "Middle_East_Spectator", type: "telegram" },
  { url: "https://rsshub.app/telegram/channel/Suriyak_maps", source: "Suriyak_maps", type: "telegram" },
  // Twitter via RSSHub
  { url: "https://rsshub.app/twitter/user/OSINTdefender", source: "@OSINTdefender", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/IntelCrab", source: "@IntelCrab", type: "twitter" },
  { url: "https://rsshub.app/twitter/user/clashreport", source: "@clashreport", type: "twitter" }
];

async function fetchRealRSSFeeds(): Promise<Article[]> {
  const articles: Article[] = [];
  
  // rss2json is highly reliable for client-side RSS fetching and avoids strict CORS
  const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";

  const fetchPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const response = await axios.get(RSS2JSON_API + encodeURIComponent(feed.url), { 
        timeout: 10000 
      });
      
      const items = response.data?.items || [];
      
      for (const item of items.slice(0, 15)) {
        const title = item.title || "";
        const link = item.link || "";
        const description = item.description || item.content || "";
        const pubDate = item.pubDate || "";
        
        if (!title || !link) continue;
        
        let publishedDate = new Date();
        if (pubDate) {
          publishedDate = new Date(pubDate);
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
  });

  await Promise.all(fetchPromises);
  return articles;
}

export async function fetchNews(): Promise<Article[]> {
  // Fetch from Reddit and RSS sources in parallel
  const [redditArticles, rssArticles] = await Promise.all([
    fetchRedditNews().catch(() => [] as Article[]),
    fetchRealRSSFeeds().catch(() => [] as Article[])
  ]);

  // Merge all sources, sort by published date (newest first)
  const allArticles = [...redditArticles, ...rssArticles];
  allArticles.sort((a, b) => b.published.getTime() - a.published.getTime());

  // If we couldn't fetch anything (due to network/CORS), fallback to a basic alert
  if (allArticles.length === 0) {
    allArticles.push({
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

  return allArticles;
}

export async function fetchPrices(): Promise<PriceData> {
  try {
    // Fetch from CoinGecko API (free tier)
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
    );

    const data = response.data;

    return {
      btc: {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
      },
      eth: {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
      },
      gold: {
        price: 2142.5, // Mock gold price (would need separate API)
        change24h: 0.8,
      },
      oil: {
        price: 82.45, // Mock oil price
        change24h: -1.2,
      },
    };
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Return mock data if API fails
    return {
      btc: { price: 73302.0, change24h: 7.32 },
      eth: { price: 2156.21, change24h: 8.84 },
      gold: { price: 2142.5, change24h: 0.8 },
      oil: { price: 82.45, change24h: -1.2 },
    };
  }
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
