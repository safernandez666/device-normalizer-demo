import { motion } from "motion/react";
import { PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Summary } from "../types";

const STATUS_COLORS: Record<string, string> = {
  FULLY_MANAGED: "#10b981",
  MANAGED: "#3b82f6",
  NO_EDR: "#ef4444",
  NO_MDM: "#f59e0b",
  IDP_ONLY: "#f97316",
  SERVER: "#8b5cf6",
  STALE: "#6b7280",
  UNKNOWN: "#4b5563",
};

const STATUS_LABELS: Record<string, string> = {
  FULLY_MANAGED: "Fully Managed",
  MANAGED: "Managed",
  NO_EDR: "No EDR",
  NO_MDM: "No MDM",
  IDP_ONLY: "IDP Only",
  SERVER: "Server/VM",
  STALE: "Stale",
  UNKNOWN: "Unknown",
};

const SOURCE_COLORS: Record<string, string> = {
  crowdstrike: "#ef4444",
  jumpcloud: "#3b82f6",
  okta: "#f59e0b",
};

const OS_COLORS: Record<string, string> = {
  macOS: "#a855f7",
  Windows: "#3b82f6",
  Linux: "#f59e0b",
  Unknown: "#6b7280",
};

const REGION_COLORS: Record<string, string> = {
  // 2-letter region codes
  MX: "#10b981",
  US: "#3b82f6",
  DE: "#a855f7",
  OT: "#f59e0b",
  UNKNOWN: "#6b7280",
};

const REGION_LABELS: Record<string, string> = {
  MX: "Mexico",
  US: "United States",
  DE: "Germany",
  OT: "Other",
  UNKNOWN: "Unknown",
};

interface PieChartsProps {
  summary: Summary | null;
}

export function PieCharts({ summary }: PieChartsProps) {
  const byStatus = summary?.by_status || {};
  const bySource = summary?.by_source || {};
  const byOs = summary?.by_os || {};
  const byRegion = summary?.by_region || {};
  const endpointTotal = summary?.endpoint_total ?? Object.values(byOs).reduce((a, b) => a + b, 0);

  const statusData = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#6b7280",
    }));

  const sourceData = Object.entries(bySource)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      color: SOURCE_COLORS[key] || "#6b7280",
    }));

  const osData = Object.entries(byOs)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      color: OS_COLORS[key] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  const regionData = Object.entries(byRegion)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: REGION_LABELS[key] || key,
      value,
      color: REGION_COLORS[key] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);
  const regionTotal = regionData.reduce((a, b) => a + b.value, 0);

  if (statusData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <PieIcon className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {/* Status distribution */}
            <div>
              <h4 className="mb-2 text-center text-xs font-semibold text-muted">By Status</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="glow-status">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={1}
                      stroke="rgba(0,0,0,0.3)"
                      style={{ filter: "url(#glow-status)" }}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#f3f4f6",
                      }}
                      formatter={(value, name) => [String(value), String(name)]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px" }}
                      formatter={(value: string) => <span className="text-muted">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source distribution */}
            <div>
              <h4 className="mb-2 text-center text-xs font-semibold text-muted">By Source (raw)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="glow-source">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={1}
                      stroke="rgba(0,0,0,0.3)"
                      style={{ filter: "url(#glow-source)" }}
                    >
                      {sourceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#f3f4f6",
                      }}
                      formatter={(value, name) => [String(value), String(name)]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px" }}
                      formatter={(value: string) => <span className="text-muted">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Region distribution — endpoints only (excludes servers/VMs)
                Region is derived from each device's IANA timezone in the
                deduplicator (CrowdStrike's `timezone` > JumpCloud's
                `systemTimezone`). */}
            {regionData.length > 0 && (
              <div>
                <h4 className="mb-2 text-center text-xs font-semibold text-muted">
                  By Region
                  <span className="ml-1 font-normal normal-case text-muted/70">
                    ({regionTotal} endpoints)
                  </span>
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="glow-region">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={1}
                        stroke="rgba(0,0,0,0.3)"
                        style={{ filter: "url(#glow-region)" }}
                      >
                        {regionData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                          color: "#f3f4f6",
                        }}
                        formatter={(value, name) => [String(value), String(name)]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        formatter={(value: string) => <span className="text-muted">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* OS distribution — endpoints only (excludes servers/VMs) */}
            {osData.length > 0 && (
              <div>
                <h4 className="mb-2 text-center text-xs font-semibold text-muted">
                  By OS
                  <span className="ml-1 font-normal normal-case text-muted/70">
                    ({endpointTotal} endpoints)
                  </span>
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="glow-os">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={osData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={1}
                        stroke="rgba(0,0,0,0.3)"
                        style={{ filter: "url(#glow-os)" }}
                      >
                        {osData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                          color: "#f3f4f6",
                        }}
                        formatter={(value, name) => [String(value), String(name)]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        formatter={(value: string) => <span className="text-muted">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
