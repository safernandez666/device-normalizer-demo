import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatDate, pickHostname, shortSource } from "../lib/utils";
import type { Device } from "../types";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<string, { variant: "success" | "error" | "warning" | "secondary"; label: string }> = {
  FULLY_MANAGED: { variant: "success", label: "FULL" },
  MANAGED: { variant: "success", label: "MANAGED" },
  NO_EDR: { variant: "error", label: "NO EDR" },
  NO_MDM: { variant: "warning", label: "NO MDM" },
  IDP_ONLY: { variant: "warning", label: "IDP ONLY" },
  SERVER: { variant: "secondary", label: "SERVER/VM" },
  STALE: { variant: "secondary", label: "STALE" },
  UNKNOWN: { variant: "secondary", label: "UNKNOWN" },
};

interface LowConfidenceProps {
  devices: Device[];
}

export function LowConfidence({ devices }: LowConfidenceProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const low = devices.filter((d) => (d.confidence_score || 0) < 0.5);
    const q = search.trim().toLowerCase();
    if (!q) return low;
    return low.filter((d) => {
      const owner = (d.owner_email || "").toLowerCase();
      const hostname = (d.hostnames || []).join(" ").toLowerCase();
      const reason = (d.match_reason || "").toLowerCase();
      return owner.includes(q) || hostname.includes(q) || reason.includes(q);
    });
  }, [devices, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
              Low Confidence Devices (&lt; 0.5)
            </CardTitle>
          </div>
          <Input
            placeholder="Search owner, hostname, or reason..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-64"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">Hostname</th>
                  <th className="pb-3 font-medium">Serial</th>
                  <th className="pb-3 font-medium">OS</th>
                  <th className="pb-3 font-medium">Sources</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Seen</th>
                  <th className="pb-3 pr-4 font-medium text-right">Confidence</th>
                  <th className="pb-3 pl-4 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const cfg = STATUS_BADGES[d.status] || STATUS_BADGES.UNKNOWN;
                  const { primary, aliases } = pickHostname(d.hostnames);
                  return (
                    <tr
                      key={d.canonical_id}
                      className="border-b border-border/50 transition-colors hover:bg-card/50 last:border-b-0 bg-red-500/[0.02]"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium">{d.owner_email || "N/A"}</div>
                        {d.owner_name && (
                          <div className="text-xs text-muted">{d.owner_name}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        <div
                          className="flex items-center gap-1.5"
                          title={aliases.length ? `Aliases: ${aliases.join(", ")}` : undefined}
                        >
                          <span className="truncate">{primary || "N/A"}</span>
                          {aliases.length > 0 && (
                            <span
                              className="shrink-0 rounded border border-border/60 bg-card px-1 py-0.5 font-mono text-[9px] text-muted"
                              aria-label={`${aliases.length} alias${aliases.length === 1 ? "" : "es"}`}
                            >
                              +{aliases.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted">
                        {d.serial_number || "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-muted">{d.os_type || "N/A"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {(d.sources || []).map((s) => (
                            <span key={s} className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-medium text-muted">
                              {shortSource(s)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted">
                        {formatDate(d.last_seen)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-xs font-semibold text-red-400">
                          {d.confidence_score?.toFixed(2) ?? "0.00"}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-xs text-muted">
                        {d.match_reason || ""}
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-muted">
                      No low confidence devices
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted">
              Showing {filtered.length > 0 ? start + 1 : 0}–
              {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
