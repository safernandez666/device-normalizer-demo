import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Shield,
  AlertTriangle,
  AlertCircle,
  Fingerprint,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";
import type { Summary, TrendsResponse } from "../types";

const STATUS_CONFIG = [
  {
    key: "FULLY_MANAGED",
    label: "FULLY MANAGED",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "from-emerald-500/10",
    ring: "shadow-emerald-500/10",
    positive: true,
    tooltip: "Dispositivos con MDM (JumpCloud) + EDR (CrowdStrike) + IDP (Okta) y owner asignado. Visibilidad completa.",
  },
  {
    key: "MANAGED",
    label: "MANAGED",
    icon: Shield,
    color: "text-blue-400",
    bg: "from-blue-500/10",
    ring: "shadow-blue-500/10",
    positive: true,
    tooltip: "Dispositivos con MDM (JumpCloud) + EDR (CrowdStrike). Gestionados y protegidos, pero sin confirmación de identidad vía Okta.",
  },
  {
    key: "NO_EDR",
    label: "NO EDR",
    icon: AlertCircle,
    color: "text-red-400",
    bg: "from-red-500/10",
    ring: "shadow-red-500/10",
    positive: false,
    tooltip: "Dispositivos en JumpCloud (MDM) pero sin CrowdStrike (EDR). Están gestionados pero sin protección de endpoint. Requieren instalación de CrowdStrike.",
  },
  {
    key: "NO_MDM",
    label: "NO MDM",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "from-amber-500/10",
    ring: "shadow-amber-500/10",
    positive: false,
    tooltip: "Dispositivos con CrowdStrike (EDR) pero sin JumpCloud (MDM). Tienen protección pero IT no los gestiona. Requieren enrollment en JumpCloud.",
  },
  {
    key: "IDP_ONLY",
    label: "IDP ONLY",
    icon: Fingerprint,
    color: "text-orange-400",
    bg: "from-orange-500/10",
    ring: "shadow-orange-500/10",
    positive: false,
    tooltip: "Dispositivos que solo aparecen en Okta. Pueden ser celulares personales o shadow IT. Revisar si necesitan MDM/EDR.",
  },
  {
    key: "SERVER",
    label: "SERVER/VM",
    icon: Shield,
    color: "text-violet-400",
    bg: "from-violet-500/10",
    ring: "shadow-violet-500/10",
    positive: true,
    tooltip: "Servidores y VMs con CrowdStrike (EDR) que no necesitan JumpCloud (MDM). No son endpoints de usuario.",
  },
  {
    key: "STALE",
    label: "STALE",
    icon: Clock,
    color: "text-muted",
    bg: "from-neutral-500/10",
    ring: "shadow-neutral-500/10",
    positive: false,
    tooltip: "Dispositivos sin actividad en más de 90 días. Posiblemente dados de baja, perdidos, o apagados. Candidatos a limpieza.",
  },
];

interface StatusCardsProps {
  summary: Summary | null;
  trends?: TrendsResponse | null;
}

export function StatusCards({ summary, trends }: StatusCardsProps) {
  const byStatus = summary?.by_status || {};
  const total = summary?.total || 0;
  const trendData = trends?.trends || {};
  const hasTrends = trends?.has_previous ?? false;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Inventory Status
        </h2>
        <span className="text-xs text-muted">{total} devices</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STATUS_CONFIG.map((cfg, i) => {
          const count = byStatus[cfg.key] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = cfg.icon;
          const delta = trendData[cfg.key] ?? 0;

          let trendColor = "text-muted";
          let TrendIcon = Minus;
          if (hasTrends && delta !== 0) {
            const isGood = cfg.positive ? delta > 0 : delta < 0;
            trendColor = isGood ? "text-emerald-400" : "text-red-400";
            TrendIcon = delta > 0 ? TrendingUp : TrendingDown;
          }

          return (
            <motion.div
              key={cfg.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
              className="group relative cursor-help overflow-hidden rounded-xl border border-border bg-card/95 p-5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              tabIndex={0}
              aria-label={`${cfg.label}: ${cfg.tooltip}`}
              onMouseEnter={() => setHoveredCard(cfg.key)}
              onMouseLeave={() => setHoveredCard(null)}
              onFocus={() => setHoveredCard(cfg.key)}
              onBlur={() => setHoveredCard(null)}
              onClick={() => setHoveredCard((c) => (c === cfg.key ? null : cfg.key))}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none`}
              />

              <AnimatePresence>
                {hoveredCard === cfg.key && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-x-0 bottom-0 z-10 rounded-b-xl border-t border-border bg-background/95 p-3 backdrop-blur"
                  >
                    <div className="flex gap-2">
                      <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                      <p className="text-[11px] leading-relaxed text-muted">{cfg.tooltip}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`rounded-lg border border-border bg-background p-2 ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs tabular-nums text-muted">{pct}%</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-mono text-3xl font-bold tracking-tight tabular-nums">{count}</div>
                    <div className="mt-1 text-xs font-medium text-muted">{cfg.label}</div>
                  </div>
                  {hasTrends && delta !== 0 && (
                    <div className={`flex items-center gap-0.5 ${trendColor}`}>
                      <TrendIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold tabular-nums">
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
