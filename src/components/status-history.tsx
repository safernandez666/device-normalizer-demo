import { motion } from "motion/react";
import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { StatusSnapshot } from "../types";

const STATUS_COLORS: Record<string, string> = {
  total: "#e2e8f0",
  fully_managed: "#34d399",
  managed: "#60a5fa",
  server: "#8b5cf6",
  no_edr: "#f87171",
  no_mdm: "#fbbf24",
  idp_only: "#fb923c",
  stale: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  total: "Unique Devices",
  fully_managed: "Fully Managed",
  managed: "Managed",
  server: "Server/VM",
  no_edr: "No EDR",
  no_mdm: "No MDM",
  idp_only: "IDP Only",
  stale: "Stale",
};

interface StatusHistoryProps {
  history: StatusSnapshot[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function StatusHistory({ history }: StatusHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  const chartData = history.map((s) => ({
    time: formatTime(s.recorded_at),
    total: s.total,
    fully_managed: s.fully_managed,
    managed: s.managed,
    server: s.server,
    no_edr: s.no_edr,
    no_mdm: s.no_mdm,
    idp_only: s.idp_only,
    stale: s.stale,
  }));

  const seriesKeys = ["total", "fully_managed", "managed", "server", "no_edr", "no_mdm", "idp_only", "stale"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Activity className="h-4 w-4 text-accent" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  {seriesKeys.map((key) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={STATUS_COLORS[key]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={STATUS_COLORS[key]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "#f3f4f6",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={(value: string) => STATUS_LABELS[value] || value}
                />
                {seriesKeys.map((key) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={STATUS_COLORS[key]}
                    strokeWidth={key === "total" ? 2.5 : 2}
                    strokeDasharray={key === "total" ? "6 3" : undefined}
                    fill={key === "total" ? "none" : `url(#grad-${key})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
