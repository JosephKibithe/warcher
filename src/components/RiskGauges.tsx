import { useMemo } from "react";
import { Activity, TrendingUp, DollarSign, Shield } from "lucide-react";
import type { Article, PriceData } from "../services/api";

interface RiskGaugesProps {
  articles: Article[];
  prices: PriceData | null;
  escalationLevel: number;
}

function MiniGauge({
  value,
  max = 10,
  color,
  label,
  icon,
  sublabel,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
  icon: React.ReactNode;
  sublabel: string;
}) {
  const pct = Math.min(1, Math.max(0, value / max));

  // Segmented bar style
  const segments = 10;
  const filledSegments = Math.round(pct * segments);

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#0f0f14] border border-gray-800 rounded flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color }} className="opacity-70">{icon}</span>
          <span className="text-[9px] font-bold tracking-widest text-gray-400">{label}</span>
        </div>
        <span
          className="text-sm font-black font-mono"
          style={{ color }}
        >
          {value.toFixed(1)}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-sm transition-all duration-700"
            style={{
              backgroundColor: i < filledSegments ? color : "#1f2937",
              opacity: i < filledSegments ? (0.4 + (i / segments) * 0.6) : 1,
            }}
          />
        ))}
      </div>

      <div className="text-[9px] font-mono tracking-wider" style={{ color, opacity: 0.7 }}>
        {sublabel}
      </div>
    </div>
  );
}

export function RiskGauges({ articles, prices, escalationLevel }: RiskGaugesProps) {
  // Geopolitical risk = escalation level (already computed from articles)
  const geoRisk = escalationLevel;

  // Market stress: derived from price volatility
  const marketStress = useMemo(() => {
    if (!prices) return 3.0;
    const changes = [
      Math.abs(prices.btc.change24h || 0),
      Math.abs(prices.eth.change24h || 0),
      Math.abs(prices.oil.change24h || 0),
      Math.abs(prices.gold.change24h || 0),
    ];
    const avgVolatility = changes.reduce((a, b) => a + b, 0) / changes.length;
    // Scale: 5% avg change = ~5 stress, 15% = ~9 stress
    return Math.min(10, Math.max(1, avgVolatility * 0.7));
  }, [prices]);

  // Cyber/Info ops risk: based on CYBER + PROXY + SANCTIONS category articles
  const cyberRisk = useMemo(() => {
    const cyberArticles = articles.filter(
      (a) => a.category === "CYBER" || a.category === "PROXY" || a.category === "SANCTIONS"
    );
    const highCount = cyberArticles.filter((a) => a.priority === "HIGH").length;
    return Math.min(10, Math.max(1, 1.5 + cyberArticles.length * 0.3 + highCount * 1.2));
  }, [articles]);

  const getGeoLabel = (v: number) =>
    v >= 8 ? "CRITICAL" : v >= 6 ? "ELEVATED" : v >= 4 ? "MODERATE" : "LOW";

  const getMarketLabel = (v: number) =>
    v >= 7 ? "VOLATILE" : v >= 4 ? "STRESSED" : "STABLE";

  const getCyberLabel = (v: number) =>
    v >= 7 ? "HIGH THREAT" : v >= 4 ? "ACTIVE OPS" : "MONITORING";

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-[#0f0f14]">
        <Activity className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-bold tracking-wider text-purple-300">
          RISK GAUGES
        </h2>
        <div className="ml-auto text-[9px] text-gray-600 font-mono tracking-widest">
          COMPOSITE INTELLIGENCE
        </div>
      </div>

      <div className="p-3 flex gap-2">
        <MiniGauge
          value={geoRisk}
          color="#f97316"
          label="GEO RISK"
          icon={<Shield className="w-3 h-3" />}
          sublabel={getGeoLabel(geoRisk)}
        />
        <MiniGauge
          value={parseFloat(marketStress.toFixed(1))}
          color="#60a5fa"
          label="MARKET STRESS"
          icon={<DollarSign className="w-3 h-3" />}
          sublabel={getMarketLabel(marketStress)}
        />
        <MiniGauge
          value={parseFloat(cyberRisk.toFixed(1))}
          color="#a855f7"
          label="CYBER/INFO OPS"
          icon={<TrendingUp className="w-3 h-3" />}
          sublabel={getCyberLabel(cyberRisk)}
        />
      </div>
    </div>
  );
}
