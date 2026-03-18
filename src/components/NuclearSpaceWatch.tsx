import { useMemo } from "react";
import { Atom, Satellite, ShieldAlert, TrendingUp } from "lucide-react";
import type { Article } from "../services/api";

interface NuclearSpaceWatchProps {
  articles: Article[];
}

const NUCLEAR_KEYWORDS = [
  "nuclear", "uranium", "enrichment", "warhead", "icbm", "plutonium",
  "atomic", "jcpoa", "radiological", "fissile",
];

const SPACE_KEYWORDS = [
  "satellite", "launch", "orbit", "space", "missile defense", "icbm",
  "hypersonic", "celestrak", "rocket", "iss",
];

function RadialGauge({
  value,
  max = 10,
  color,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
  sublabel: string;
}) {
  const pct = Math.min(1, value / max);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° arc
  const offset = arc - pct * arc;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 70 70" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="6"
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${arc - offset} ${circumference - (arc - offset)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-sm font-black font-mono"
            style={{ color }}
          >
            {value.toFixed(0)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[9px] font-bold tracking-widest text-gray-400">{label}</div>
        <div className="text-[8px] text-gray-600 tracking-wider">{sublabel}</div>
      </div>
    </div>
  );
}

export function NuclearSpaceWatch({ articles }: NuclearSpaceWatchProps) {
  const nuclearArticles = useMemo(
    () =>
      articles.filter((a) => {
        const lower = a.title.toLowerCase();
        return (
          a.category === "NUCLEAR" ||
          NUCLEAR_KEYWORDS.some((kw) => lower.includes(kw))
        );
      }),
    [articles]
  );

  const spaceArticles = useMemo(
    () =>
      articles.filter((a) => {
        const lower = a.title.toLowerCase();
        return SPACE_KEYWORDS.some((kw) => lower.includes(kw));
      }),
    [articles]
  );

  const nuclearRisk = useMemo(() => {
    const base = 1;
    const highCount = nuclearArticles.filter((a) => a.priority === "HIGH").length;
    return Math.min(10, base + highCount * 2 + nuclearArticles.length * 0.5);
  }, [nuclearArticles]);

  const spaceActivity = useMemo(() => {
    return Math.min(10, spaceArticles.length * 1.5);
  }, [spaceArticles]);

  const getNuclearStatus = (risk: number) => {
    if (risk >= 7) return { label: "CRITICAL", color: "#ef4444" };
    if (risk >= 4) return { label: "ELEVATED", color: "#f59e0b" };
    return { label: "NOMINAL", color: "#10b981" };
  };

  const nuclearStatus = getNuclearStatus(nuclearRisk);

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-[#0f0f14]">
        <Atom className="w-4 h-4 text-yellow-500" />
        <h2 className="text-sm font-bold tracking-wider text-yellow-400">
          NUCLEAR / SPACE WATCH
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500/70 rounded-full animate-pulse" />
          <span className="text-[10px] text-yellow-500/70 font-mono">ACTIVE</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Gauges Row */}
        <div className="flex justify-around items-end py-2">
          <RadialGauge
            value={nuclearRisk}
            color={nuclearStatus.color}
            label="NUCLEAR RISK"
            sublabel={nuclearStatus.label}
          />
          <div className="flex flex-col items-center justify-center gap-1">
            <ShieldAlert
              className="w-5 h-5"
              style={{ color: nuclearStatus.color }}
            />
            <span
              className="text-[10px] font-black tracking-widest"
              style={{ color: nuclearStatus.color }}
            >
              {nuclearStatus.label}
            </span>
            <span className="text-[9px] text-gray-600">STATUS</span>
          </div>
          <RadialGauge
            value={spaceActivity}
            color="#818cf8"
            label="SPACE ACTIVITY"
            sublabel={`${spaceArticles.length} SIGNALS`}
          />
        </div>

        {/* Nuclear Headlines */}
        {nuclearArticles.length > 0 ? (
          <div className="space-y-1">
            <div className="text-[9px] font-bold tracking-widest text-yellow-500/70 flex items-center gap-1 mb-1">
              <Atom className="w-3 h-3" />
              NUCLEAR SIGNALS ({nuclearArticles.length})
            </div>
            {nuclearArticles.slice(0, 3).map((a) => (
              <a
                key={a.id}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-gray-400 hover:text-yellow-300 transition-colors border-l-2 border-yellow-900 pl-2 py-0.5 line-clamp-1"
              >
                {a.title}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-gray-600 text-center py-1">
            No nuclear signals detected
          </div>
        )}

        {/* Space Headlines */}
        {spaceArticles.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] font-bold tracking-widest text-indigo-400/70 flex items-center gap-1 mb-1">
              <Satellite className="w-3 h-3" />
              SPACE / STRATEGIC ({spaceArticles.length})
            </div>
            {spaceArticles.slice(0, 2).map((a) => (
              <a
                key={a.id}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-gray-400 hover:text-indigo-300 transition-colors border-l-2 border-indigo-900 pl-2 py-0.5 line-clamp-1"
              >
                {a.title}
              </a>
            ))}
          </div>
        )}

        {/* Trending Indicator */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
          <TrendingUp className="w-3 h-3 text-gray-600" />
          <span className="text-[9px] text-gray-600 font-mono">
            {nuclearArticles.length + spaceArticles.length} STRATEGIC SIGNALS IN FEED
          </span>
        </div>
      </div>
    </div>
  );
}
