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

// Map sources to their Middle East coverage pages
const SOURCE_URLS: Record<string, string> = {
  BBC: "https://www.bbc.com/news/world/middle_east",
  Reuters: "https://www.reuters.com/world/middle-east/",
  "Al Jazeera": "https://www.aljazeera.com/tag/middle-east/",
  "Jerusalem Post": "https://www.jpost.com/middle-east",
  "Al Arabiya": "https://english.alarabiya.net/News/middle-east",
  "Middle East Eye": "https://www.middleeasteye.net/",
  Reddit: "https://www.reddit.com/r/worldnews/",
  "X/Twitter": "https://x.com",
  Telegram: "https://t.me",
};

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

// Social media mock articles (Twitter/X, Telegram)
function generateSocialMockArticles(): Article[] {
  const socialData = [
    {
      title:
        "BREAKING: Satellite imagery reveals new military deployments near Iranian border",
      source: "X/Twitter",
      handle: "@IntelCrab",
      time: 8,
      link: "https://x.com/IntelCrab",
    },
    {
      title:
        "Multiple explosions reported in southern Beirut — sources on the ground",
      source: "Telegram",
      handle: "ME_Intel",
      time: 15,
      link: "https://t.me/middle_east_spectator",
    },
    {
      title:
        "Thread: Analysis of recent IDF operations in northern Gaza strip — key developments",
      source: "X/Twitter",
      handle: "@sentdefender",
      time: 22,
      link: "https://x.com/sentdefender",
    },
    {
      title:
        "🚨 USS Eisenhower carrier strike group repositioning in Red Sea amid Houthi threats",
      source: "X/Twitter",
      handle: "@WarMonitor3",
      time: 35,
      link: "https://x.com/WarMonitor3",
    },
    {
      title:
        "Unverified reports: Large convoy movement spotted near Syria-Iraq border crossing",
      source: "Telegram",
      handle: "SyriaLive",
      time: 42,
      link: "https://t.me/syikimap",
    },
    {
      title:
        "OSINT: New construction detected at Natanz nuclear facility via Planet Labs imagery",
      source: "X/Twitter",
      handle: "@CSISoverwatch",
      time: 55,
      link: "https://x.com/CSISoverwatch",
    },
    {
      title:
        "Houthi spokesperson claims successful strike on commercial vessel in Gulf of Aden",
      source: "Telegram",
      handle: "YemenUpdate",
      time: 68,
      link: "https://t.me/Yemen_updates",
    },
    {
      title:
        "Israeli cabinet reportedly in emergency session following overnight developments",
      source: "X/Twitter",
      handle: "@IsraelRadar",
      time: 78,
      link: "https://x.com/IsraelRadar_",
    },
  ];

  return socialData.map((item, index) => ({
    id: `social-${index}`,
    title: item.title,
    source: `${item.source}`,
    link: item.link,
    published: new Date(Date.now() - item.time * 60 * 1000),
    category: categorizeArticle(item.title),
    priority: determinePriority(item.title),
    sourceType: (item.source === "X/Twitter"
      ? "twitter"
      : "telegram") as Article["sourceType"],
    location: extractLocation(item.title),
  }));
}

function generateMockArticles(): Article[] {
  const mockData = [
    {
      title: "Israel launches new wave of strikes on Tehran targets",
      source: "BBC",
      time: "5m ago",
    },
    {
      title: "US CENTCOM confirms naval operations in Persian Gulf",
      source: "Reuters",
      time: "12m ago",
    },
    {
      title: "Houthi rebels claim drone attack on Saudi oil facility",
      source: "Al Jazeera",
      time: "18m ago",
    },
    {
      title: "Iran nuclear facility reports increased activity",
      source: "Jerusalem Post",
      time: "25m ago",
    },
    {
      title: "Diplomatic talks between Qatar and Iran underway in Doha",
      source: "Al Arabiya",
      time: "32m ago",
    },
    {
      title: "Hezbollah positions targeted in southern Lebanon",
      source: "Middle East Eye",
      time: "45m ago",
    },
    {
      title: "Gaza humanitarian corridor temporarily reopened",
      source: "BBC",
      time: "1h ago",
    },
    {
      title: "Turkish military conducts operations in northern Syria",
      source: "Reuters",
      time: "1h ago",
    },
    {
      title: "US embassy in Baghdad tightens security measures",
      source: "Al Jazeera",
      time: "1h ago",
    },
    {
      title: "Saudi Arabia intercepts missile fired from Yemen",
      source: "Jerusalem Post",
      time: "2h ago",
    },
    {
      title: "IAEA inspectors report concerns over Iranian uranium enrichment",
      source: "Reuters",
      time: "2h ago",
    },
    {
      title: "Clashes reported between IDF and Palestinian militants in Jenin",
      source: "BBC",
      time: "3h ago",
    },
    {
      title:
        "Russia calls for emergency UN Security Council meeting on Middle East",
      source: "Al Arabiya",
      time: "3h ago",
    },
    {
      title:
        "Egypt mediates new ceasefire negotiations between Israel and Hamas",
      source: "Middle East Eye",
      time: "4h ago",
    },
    {
      title: "Lebanon reports Israeli airstrikes near Baalbek",
      source: "Al Jazeera",
      time: "4h ago",
    },
  ];

  return mockData.map((item, index) => ({
    id: `mock-${index}`,
    title: item.title,
    source: item.source,
    link:
      SOURCE_URLS[item.source] ||
      "https://www.google.com/search?q=" + encodeURIComponent(item.title),
    published: new Date(Date.now() - index * 15 * 60 * 1000),
    category: categorizeArticle(item.title),
    priority: determinePriority(item.title),
    sourceType: "rss" as Article["sourceType"],
    location: extractLocation(item.title),
  }));
}

export async function fetchNews(): Promise<Article[]> {
  // Fetch from all sources in parallel
  const [redditArticles, mockArticles, socialArticles] = await Promise.all([
    fetchRedditNews().catch(() => [] as Article[]),
    Promise.resolve(generateMockArticles()),
    Promise.resolve(generateSocialMockArticles()),
  ]);

  // Merge all sources, sort by published date (newest first)
  const allArticles = [...redditArticles, ...socialArticles, ...mockArticles];
  allArticles.sort((a, b) => b.published.getTime() - a.published.getTime());

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
    };
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Return mock data if API fails
    return {
      btc: { price: 73302.0, change24h: 7.32 },
      eth: { price: 2156.21, change24h: 8.84 },
      gold: { price: 2142.5, change24h: 0.8 },
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
