// server/sources/coingecko.mjs
// CoinGecko v3 — free, no key required
import fetch from 'node-fetch';

const URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';

export async function fetchCrypto() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(8000) });
    const d = await res.json();
    return {
      btc: { price: d.bitcoin?.usd ?? 0, change24h: d.bitcoin?.usd_24h_change ?? 0 },
      eth: { price: d.ethereum?.usd ?? 0, change24h: d.ethereum?.usd_24h_change ?? 0 },
      sol: { price: d.solana?.usd ?? 0, change24h: d.solana?.usd_24h_change ?? 0 },
    };
  } catch (err) {
    console.warn('[CoinGecko] fetch failed:', err.message);
    return null;
  }
}
