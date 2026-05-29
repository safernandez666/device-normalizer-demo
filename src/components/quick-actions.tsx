import { motion } from "motion/react";
import {
  Zap,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface Action {
  priority: string;
  title: string;
  description: string;
}

interface QuickActionsProps {
  actions: Action[];
}

type AlertVariant = "default" | "destructive" | "warning" | "info" | "success";

const PRIORITY_CONFIG: Record<string, {
  icon: typeof AlertOctagon;
  variant: AlertVariant;
  label: string;
  badgeClass: string;
  sortOrder: number;
}> = {
  critical: {
    icon: AlertOctagon,
    variant: "destructive",
    label: "CRITICAL",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-400",
    sortOrder: 0,
  },
  high: {
    icon: AlertTriangle,
    variant: "warning",
    label: "HIGH",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    sortOrder: 1,
  },
  medium: {
    icon: Info,
    variant: "info",
    label: "MEDIUM",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    sortOrder: 2,
  },
  low: {
    icon: Info,
    variant: "default",
    label: "LOW",
    badgeClass: "border-border bg-card/60 text-muted",
    sortOrder: 3,
  },
  info: {
    icon: Info,
    variant: "info",
    label: "INFO",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    sortOrder: 4,
  },
  success: {
    icon: CheckCircle2,
    variant: "success",
    label: "OK",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    sortOrder: 5,
  },
};

function ActionAlert({ action, index }: { action: Action; index: number }) {
  const cfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
      role="listitem"
    >
      <Alert variant={cfg.variant}>
        <Icon className="h-5 w-5" aria-hidden="true" />
        <AlertTitle className="flex flex-wrap items-center gap-2">
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
          <span className="text-pretty">{action.title}</span>
        </AlertTitle>
        <AlertDescription>{action.description}</AlertDescription>
      </Alert>
    </motion.div>
  );
}

export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null;

  const sorted = [...actions].sort((a, b) => {
    const aOrder = PRIORITY_CONFIG[a.priority]?.sortOrder ?? 99;
    const bOrder = PRIORITY_CONFIG[b.priority]?.sortOrder ?? 99;
    return aOrder - bOrder;
  });

  const urgent = sorted.filter((a) => a.priority === "critical" || a.priority === "high");
  const other = sorted.filter((a) => a.priority !== "critical" && a.priority !== "high");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
            Quick Actions
          </CardTitle>
          {urgent.length > 0 && (
            <span className="ml-auto rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
              {urgent.length} urgent
            </span>
          )}
        </CardHeader>
        <CardContent>
          {urgent.length > 0 && (
            <div className="mb-4" role="list" aria-label="Urgent actions">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-red-400/70">
                Requires attention
              </h4>
              <div className="space-y-2">
                {urgent.map((action, i) => (
                  <ActionAlert key={`urgent-${i}`} action={action} index={i} />
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div role="list" aria-label="Other recommendations">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                Recommendations
              </h4>
              <div className="space-y-2">
                {other.map((action, i) => (
                  <ActionAlert key={`other-${i}`} action={action} index={urgent.length + i} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
