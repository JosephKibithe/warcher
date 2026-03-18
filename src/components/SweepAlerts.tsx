import { useState, useEffect } from "react";
import { AlertTriangle, Zap, Bell, X, Radio } from "lucide-react";
import type { SweepDelta } from "../services/sweep";
import type { Article } from "../services/api";

interface SweepAlertsProps {
  delta: SweepDelta | null;
}

interface AlertItem {
  id: string;
  article: Article;
  tier: "FLASH" | "PRIORITY" | "ROUTINE";
  dismissedAt?: number;
}

export function SweepAlerts({ delta }: SweepAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [visible, setVisible] = useState(true);

  // When a new sweep delta arrives, push new alerts
  useEffect(() => {
    if (!delta || delta.totalNew === 0) return;

    const newAlerts: AlertItem[] = [
      ...delta.flash.map((a) => ({ id: a.id + "-f", article: a, tier: "FLASH" as const })),
      ...delta.priority.map((a) => ({ id: a.id + "-p", article: a, tier: "PRIORITY" as const })),
      ...delta.routine.slice(0, 3).map((a) => ({ id: a.id + "-r", article: a, tier: "ROUTINE" as const })),
    ];

    if (newAlerts.length === 0) return;

    setAlerts((prev) => {
      // Deduplicate by id
      const existingIds = new Set(prev.map((x) => x.id));
      const fresh = newAlerts.filter((a) => !existingIds.has(a.id));
      return [...fresh, ...prev].slice(0, 10); // cap at 10 visible
    });
    setVisible(true);

    // Auto-dismiss ROUTINE alerts after 60s
    const timeout = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.tier !== "ROUTINE"));
    }, 60000);
    return () => clearTimeout(timeout);
  }, [delta]);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const dismissAll = () => {
    setAlerts([]);
    setVisible(false);
  };

  if (!visible || alerts.length === 0) return null;

  const flashCount = alerts.filter((a) => a.tier === "FLASH").length;
  const priorityCount = alerts.filter((a) => a.tier === "PRIORITY").length;
  const routineCount = alerts.filter((a) => a.tier === "ROUTINE").length;

  const tierConfig = {
    FLASH: {
      bg: "bg-red-950/90 border-red-500/70",
      badge: "bg-red-500 text-white",
      icon: <Zap className="w-3 h-3" />,
      text: "text-red-200",
      pulse: true,
    },
    PRIORITY: {
      bg: "bg-amber-950/80 border-amber-500/50",
      badge: "bg-amber-500 text-black",
      icon: <AlertTriangle className="w-3 h-3" />,
      text: "text-amber-200",
      pulse: false,
    },
    ROUTINE: {
      bg: "bg-gray-900/80 border-gray-700/50",
      badge: "bg-gray-600 text-gray-200",
      icon: <Bell className="w-3 h-3" />,
      text: "text-gray-400",
      pulse: false,
    },
  };

  return (
    <div className="mx-4 mt-2 mb-0 space-y-1 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Alert Summary Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0f14] border border-gray-800 rounded-t text-[10px] font-mono font-bold tracking-widest">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
            <span className="text-cyan-400">SWEEP #{delta?.sweepNumber} DELTA</span>
          </span>
          {flashCount > 0 && (
            <span className="flex items-center gap-1 text-red-400 animate-pulse">
              <Zap className="w-3 h-3" />
              {flashCount} FLASH
            </span>
          )}
          {priorityCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {priorityCount} PRIORITY
            </span>
          )}
          {routineCount > 0 && (
            <span className="text-gray-500">{routineCount} ROUTINE</span>
          )}
        </div>
        <button
          onClick={dismissAll}
          className="text-gray-600 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          CLEAR
        </button>
      </div>

      {/* Individual alerts (show top 5, prioritized) */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {alerts.slice(0, 6).map((alert) => {
          const cfg = tierConfig[alert.tier];
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 px-3 py-2 border rounded-sm text-xs font-mono ${cfg.bg} transition-all`}
            >
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${cfg.badge} ${cfg.pulse ? "animate-pulse" : ""}`}
              >
                {cfg.icon}
                {alert.tier}
              </span>
              <span className={`flex-1 leading-snug ${cfg.text} line-clamp-2`}>
                {alert.article.title}
              </span>
              <span className="text-gray-700 text-[10px] shrink-0 mt-0.5">
                {alert.article.source}
              </span>
              <button
                onClick={() => dismiss(alert.id)}
                className="text-gray-700 hover:text-gray-400 transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
