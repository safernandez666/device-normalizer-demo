import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Device, SyncRun } from "../types";

interface QualityMetricsProps {
  devices: Device[];
  lastSync: SyncRun | null;
}

export function QualityMetrics({ devices, lastSync }: QualityMetricsProps) {
  const totalRaw = lastSync?.total_raw_devices || 0;
  const final = lastSync?.final_count || 0;
  const removed = lastSync?.duplicates_removed || 0;
  const dedupRate = totalRaw > 0 ? ((removed / totalRaw) * 100).toFixed(1) : "0.0";

  let overlap = 0;
  devices.forEach((d) => {
    const s = d.sources || [];
    if (s.includes("crowdstrike") && s.includes("jumpcloud")) overlap++;
  });
  const overlapRate = final > 0 ? ((overlap / final) * 100).toFixed(1) : "0.0";

  const metrics = [
    { label: "Raw Devices", value: totalRaw.toString(), sub: "before dedup" },
    { label: "Duplicates Removed", value: removed.toString(), sub: `${dedupRate}% reduction` },
    { label: "Final Inventory", value: final.toString(), sub: "unique devices" },
    { label: "CS ↔ JC Overlap", value: `${overlapRate}%`, sub: `${overlap} devices correlated` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <BarChart3 className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Normalization Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="text-xs text-muted">{m.label}</div>
                <div className="mt-1 text-2xl font-bold">{m.value}</div>
                <div className="mt-1 text-xs text-muted">{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
