import { motion } from "motion/react";
import { Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Summary, SyncRun } from "../types";

const ALL_SOURCES = ["crowdstrike", "okta", "jumpcloud"];

interface SourcesHealthProps {
  summary: Summary | null;
  lastSync: SyncRun | null;
}

export function SourcesHealth({ summary, lastSync }: SourcesHealthProps) {
  const ok = lastSync?.sources_ok || [];
  const failed = lastSync?.sources_failed || [];
  const bySource = summary?.by_source || {};

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Server className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Sources Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium text-right">Devices (raw)</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-center">Failed</th>
                </tr>
              </thead>
              <tbody>
                {ALL_SOURCES.map((s) => {
                  const isFailed = failed.includes(s);
                  const isOk = ok.includes(s);
                  const rawCount = bySource[s] || 0;

                  return (
                    <tr
                      key={s}
                      className="border-b border-border/50 transition-colors hover:bg-card/50 last:border-b-0"
                    >
                      <td className="flex items-center gap-2 py-3 font-medium">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isFailed
                              ? "bg-red-500"
                              : isOk
                              ? "bg-emerald-500"
                              : "bg-muted"
                          }`}
                        />
                        {s}
                      </td>
                      <td className="py-3 text-right text-muted">{rawCount}</td>
                      <td className="py-3 text-center">
                        <Badge variant={isFailed ? "error" : "success"}>
                          {isFailed ? "Error" : isOk ? "Healthy" : "Idle"}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={
                            isFailed
                              ? "font-semibold text-red-400"
                              : "text-emerald-400"
                          }
                        >
                          {isFailed ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
