// server/sources/yahoo.mjs
// Yahoo Finance query1 API — free, no key required
// Fetches major indexes and commodities
import fetch from 'node-fetch';

const SYMBOLS = {
  '^GSPC': 'SP500',
  '^DJI': 'DOW',
  '^IXIC': 'NASDAQ',
  'DX-Y.NYB': 'DXY',
  'GC=F': 'GOLD_FUT',
  'CL=F': 'OIL_WTI',
  'NG=F': 'NAT_GAS',
};

export async function fetchYahooFinance() {
  try {
    const syms = Object.keys(SYMBOLS).map(encodeURIComponent).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms}&fields=regularMarketPrice,regularMarketChangePercent`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });
    const json = await res.json();
    const quotes = json?.quoteResponse?.result || [];
    const result = {};
    for (const q of quotes) {
      const key = SYMBOLS[q.symbol];
      if (key) {
        result[key] = {
          price: q.regularMarketPrice ?? 0,
          change24h: q.regularMarketChangePercent ?? 0,
        };
      }
    }
    return result;
  } catch (err) {
    console.warn('[Yahoo Finance] fetch failed:', err.message);
    return null;
  }
}
