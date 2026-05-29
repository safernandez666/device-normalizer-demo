import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { GitCompare, Plus, Minus, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { shortSource } from "../lib/utils";

interface DiffData {
  new_devices: { count: number; devices: { hostname: string; owner: string | null; status: string; sources: string[] }[] };
  disappeared: { count: number; devices: { hostname: string; owner: string | null; status: string; sources: string[] }[] };
  newly_stale: { count: number; devices: { hostname: string; owner: string | null; status: string }[] };
  status_changes: Record<string, { previous: number; current: number; delta: number }>;
  total_current: number;
}

interface SyncDiffProps {
  diff: DiffData | null;
  lastSyncFinished?: string | null;
}

const TEN_MINUTES = 10 * 60 * 1000;

export function SyncDiff({ diff, lastSyncFinished }: SyncDiffProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!lastSyncFinished) return;
    const check = () => {
      const elapsed = Date.now() - new Date(lastSyncFinished).getTime();
      if (elapsed > TEN_MINUTES) setVisible(false);
      else setVisible(true);
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [lastSyncFinished]);

  if (!diff || !visible) return null;

  const hasChanges = diff.new_devices.count > 0 || diff.disappeared.count > 0 ||
    diff.newly_stale.count > 0 || Object.keys(diff.status_changes).length > 0;

  if (!hasChanges) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <GitCompare className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Changes Since Last Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status changes */}
            {Object.keys(diff.status_changes).length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Status Changes</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(diff.status_changes).map(([status, change]) => (
                    <div key={status} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                      change.delta > 0 && ["NO_EDR", "NO_MDM", "IDP_ONLY", "STALE"].includes(status)
                        ? "border-red-500/20 bg-red-500/5 text-red-500"
                        : change.delta < 0 && ["NO_EDR", "NO_MDM", "IDP_ONLY", "STALE"].includes(status)
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                        : change.delta > 0 && ["MANAGED", "FULLY_MANAGED"].includes(status)
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                        : "border-border bg-card"
                    }`}>
                      <span className="font-semibold">{status}</span>
                      <span className="text-muted">{change.previous}</span>
                      <ArrowRight className="h-3 w-3 text-muted" />
                      <span className="font-bold">{change.current}</span>
                      <span className={`text-[10px] font-bold ${change.delta > 0 ? "" : ""}`}>
                        ({change.delta > 0 ? "+" : ""}{change.delta})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New devices */}
            {diff.new_devices.count > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> {diff.new_devices.count} New Devices
                </h4>
                <div className="space-y-1">
                  {diff.new_devices.devices.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{d.hostname}</span>
                      <span className="text-muted">—</span>
                      <span className="text-muted">{d.owner || "no owner"}</span>
                      <div className="flex gap-0.5">
                        {d.sources.map((s) => (
                          <span key={s} className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-medium text-muted">{shortSource(s)}</span>
                        ))}
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        d.status === "MANAGED" || d.status === "FULLY_MANAGED" ? "text-emerald-500" : "text-amber-500"
                      }`}>{d.status}</span>
                    </div>
                  ))}
                  {diff.new_devices.count > 5 && (
                    <span className="text-[10px] text-muted">+ {diff.new_devices.count - 5} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Disappeared */}
            {diff.disappeared.count > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1">
                  <Minus className="h-3 w-3" /> {diff.disappeared.count} Disappeared
                </h4>
                <div className="space-y-1">
                  {diff.disappeared.devices.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-medium line-through">{d.hostname}</span>
                      <span>—</span>
                      <span>{d.owner || "no owner"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newly stale */}
            {diff.newly_stale.count > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {diff.newly_stale.count} Went Stale
                </h4>
                <div className="space-y-1">
                  {diff.newly_stale.devices.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-medium">{d.hostname}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
