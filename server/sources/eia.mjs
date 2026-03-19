// server/sources/eia.mjs
// EIA API v2 (US Energy Information Administration) — requires EIA_API_KEY
import fetch from 'node-fetch';

export async function fetchEIA() {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return null;

  try {
    const [oilRes, gasRes] = await Promise.all([
      fetch(
        `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`,
        { signal: AbortSignal.timeout(8000) }
      ),
      fetch(
        `https://api.eia.gov/v2/natural-gas/pri/sum/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[series][]=N9190US3&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`,
        { signal: AbortSignal.timeout(8000) }
      ),
    ]);

    const oilData = (await oilRes.json())?.response?.data || [];
    const gasData = (await gasRes.json())?.response?.data || [];

    const oilCur = parseFloat(oilData[0]?.value ?? '0');
    const oilPrev = parseFloat(oilData[1]?.value ?? oilCur.toString());
    const gasСur = parseFloat(gasData[0]?.value ?? '0');
    const gasPrev = parseFloat(gasData[1]?.value ?? gasСur.toString());

    return {
      oil: { price: oilCur, change24h: oilPrev ? ((oilCur - oilPrev) / oilPrev) * 100 : 0 },
      gas: { price: gasСur, change24h: gasPrev ? ((gasСur - gasPrev) / gasPrev) * 100 : 0 },
    };
  } catch (err) {
    console.warn('[EIA] fetch failed:', err.message);
    return null;
  }
}
