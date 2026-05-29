import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { api } from "../lib/api";

// Stable selection — the CTLs that map to an external risk-framework
// reference (KRI/CIS). Picking by "top N by affected" would shuffle the
// dashboard layout day to day; this list only changes when CONTROLS_META
// changes server-side.
const HIGHLIGHTED = [
  { id: "CTL-002", ref: "KRI0021", short: "JC sin EDR" },
  { id: "CTL-005", ref: "CIS0102", short: "Users sin device" },
  { id: "CTL-007", ref: "CIS0101", short: "MDM sin reportar" },
  { id: "CTL-008", ref: "KRI0022", short: "EDR sin reportar" },
];

interface Control {
  id: string;
  status: "pass" | "fail";
  affected: number;
  total: number;
}

interface ControlsResponse {
  controls: Control[];
  summary: { total: number; passing: number; failing: number };
}

export function ControlsHealth() {
  const [data, setData] = useState<ControlsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getControls()
      .then((res: ControlsResponse) => { if (!cancelled) setData(res); })
      .catch(() => { /* skeleton stays */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const summary = data?.summary;
  const byId: Record<string, Control> = {};
  (data?.controls || []).forEach((c) => { byId[c.id] = c; });

  const passing = summary?.passing ?? 0;
  const total = summary?.total ?? HIGHLIGHTED.length;
  const failing = summary?.failing ?? 0;
  const pct = total > 0 ? Math.round((passing / total) * 100) : 0;
  const gaugeColor =
    failing === 0 ? "bg-emerald-500" : failing <= 2 ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
              Controls Health
            </CardTitle>
          </div>
          <a
            href="/controls"
            className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent>
          {/* Gauge */}
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-bold">{loading ? "—" : passing}</span>
                <span className="text-sm text-muted"> / {total} passing</span>
              </div>
              {failing > 0 && !loading && (
                <span className="text-xs font-semibold text-red-400">
                  {failing} failing
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
              <div
                className={`h-full transition-all ${gaugeColor}`}
                style={{ width: loading ? "0%" : `${pct}%` }}
              />
            </div>
          </div>

          {/* Highlighted CTL tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {HIGHLIGHTED.map((h) => {
              const c = byId[h.id];
              const pass = c?.status === "pass";
              const affected = c?.affected ?? 0;
              return (
                <a
                  key={h.id}
                  href="/controls"
                  className={`rounded-xl border p-3 transition-all hover:bg-card/50 ${
                    loading
                      ? "border-border bg-background"
                      : pass
                        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                        : "border-red-500/20 bg-red-500/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-muted bg-card px-1.5 py-0.5 rounded border border-border">
                      {h.id}
                    </span>
                    {!loading && (pass ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ))}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      loading ? "text-muted" : pass ? "" : "text-red-400"
                    }`}
                  >
                    {loading ? "—" : affected}
                  </div>
                  <div className="text-[10px] text-muted leading-tight mt-1">
                    {h.short}
                  </div>
                  <div className="text-[9px] text-muted/70 mt-0.5 font-mono">
                    {h.ref}
                  </div>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
