import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Summary } from "../types";

interface RiskGaugeProps {
  summary: Summary | null;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export function RiskGauge({ summary }: RiskGaugeProps) {
  const score = summary?.risk_score ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // Semicircle using stroke-dasharray
  const r = 80;
  const strokeW = 14;
  const cx = 110;
  const cy = 95;
  const circumference = Math.PI * r; // half circle
  const filled = (score / 100) * circumference;

  const byStatus = summary?.by_status || {};
  const total = summary?.total || 0;
  const managed = (byStatus.MANAGED || 0) + (byStatus.FULLY_MANAGED || 0);
  const coveragePct = total > 0 ? Math.round((managed / total) * 100) : 0;

  const stats = [
    { label: "Managed (MDM+EDR)", value: `${managed}/${total}`, color: "" },
    { label: "Coverage", value: `${coveragePct}%`, color: "" },
    { label: "Without EDR", value: String(byStatus.NO_EDR || 0), color: "text-red-500" },
    { label: "Without MDM", value: String(byStatus.NO_MDM || 0), color: "text-amber-500" },
    { label: "IDP Only", value: String(byStatus.IDP_ONLY || 0), color: "text-orange-500" },
    { label: "Stale", value: String(byStatus.STALE || 0), color: "text-muted" },
  ];

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ShieldAlert className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Fleet Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
            {/* Gauge */}
            <div className="shrink-0">
              <svg width="220" height="120" viewBox="0 0 220 120">
                <defs>
                  <linearGradient id="gauge-track" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.12" />
                  </linearGradient>
                  <filter id="gauge-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Track (background arc) */}
                <path
                  d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                  fill="none"
                  stroke="url(#gauge-track)"
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                />

                {/* Filled arc */}
                <motion.path
                  d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - filled }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  filter="url(#gauge-glow)"
                />

                {/* Score */}
                <text x={cx} y={cy - 18} textAnchor="middle" style={{ fontSize: "36px", fontWeight: 800 }} className="fill-foreground">
                  {score}
                </text>
                <text x={cx} y={cy + 2} textAnchor="middle" style={{ fontSize: "13px", fontWeight: 600, fill: color }}>
                  {label}
                </text>

                {/* Min/Max labels */}
                <text x={cx - r - 2} y={cy + 14} textAnchor="middle" style={{ fontSize: "9px" }} className="fill-muted">0</text>
                <text x={cx + r + 2} y={cy + 14} textAnchor="middle" style={{ fontSize: "9px" }} className="fill-muted">100</text>
              </svg>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted leading-relaxed border-t border-border pt-2">
                Weighted score: Fully Managed=100, Managed=80, Server=75, No MDM=40, No EDR=25, IDP Only=15, Stale=5
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
