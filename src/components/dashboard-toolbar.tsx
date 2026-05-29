import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Download,
  RefreshCw,
  FileDown,
  RotateCw,
} from "lucide-react";
import type { Insight } from "../types";

interface DashboardToolbarProps {
  insights: Insight[];
  onRefreshInsights?: () => void;
  refreshing?: boolean;
  onSync?: () => void;
  syncing?: boolean;
  onExportPdf?: () => void;
  exporting?: boolean;
}

const PRIORITY_CONFIG: Record<string, {
  icon: typeof AlertOctagon;
  color: string;
  bg: string;
  border: string;
  label: string;
  sortOrder: number;
}> = {
  critical: { icon: AlertOctagon, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20", label: "CRITICAL", sortOrder: 0 },
  high: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20", label: "HIGH", sortOrder: 1 },
  medium: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20", label: "MEDIUM", sortOrder: 2 },
  low: { icon: Info, color: "text-muted", bg: "bg-neutral-500/5", border: "border-neutral-500/20", label: "LOW", sortOrder: 3 },
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20", label: "OK", sortOrder: 5 },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20", label: "INFO", sortOrder: 4 },
};

const TOOLBAR_BTN =
  "relative inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-50";

function ActionItem({ action, index }: { action: Insight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.05 + index * 0.03 }}
      role="listitem"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`w-full rounded-lg border ${cfg.border} ${cfg.bg} p-3 text-left transition-colors hover:bg-card/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none`}
      >
        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 shrink-0 ${cfg.color}`} aria-hidden="true">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                {cfg.label}
              </span>
              <h4 className="text-xs font-semibold text-pretty leading-snug">{action.title}</h4>
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 text-[11px] leading-relaxed text-muted"
                >
                  {action.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-0.5 shrink-0 text-muted opacity-40" aria-hidden="true">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export function DashboardToolbar({
  insights,
  onRefreshInsights,
  refreshing,
  onSync,
  syncing,
  onExportPdf,
  exporting,
}: DashboardToolbarProps) {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const sorted = [...insights].sort((a, b) => {
    const aOrder = PRIORITY_CONFIG[a.priority]?.sortOrder ?? 99;
    const bOrder = PRIORITY_CONFIG[b.priority]?.sortOrder ?? 99;
    return aOrder - bOrder;
  });

  const urgent = sorted.filter((a) => a.priority === "critical" || a.priority === "high");
  const other = sorted.filter((a) => a.priority !== "critical" && a.priority !== "high");

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={onSync} disabled={syncing} className={TOOLBAR_BTN} aria-label="Sync now">
          <RotateCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />
          {syncing ? "Syncing…" : "Sync"}
        </button>

        <button type="button" onClick={() => setOpen(true)} className={TOOLBAR_BTN} aria-label="Quick Actions">
          <Zap className="h-4 w-4" aria-hidden="true" />
          Quick Actions
          {urgent.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {urgent.length}
            </span>
          )}
        </button>

        <div className="relative">
          <button type="button" onClick={() => setExportOpen((v) => !v)} className={TOOLBAR_BTN} aria-label="Export" aria-expanded={exportOpen}>
            <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} aria-hidden="true" />
            Export
          </button>
          <AnimatePresence>
            {exportOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => { onExportPdf?.(); setExportOpen(false); }}
                  disabled={exporting}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors hover:bg-background disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4 text-muted" />
                  {exporting ? "Exporting…" : "PDF Report"}
                </button>
                <a
                  href="/api/export/csv"
                  onClick={() => setExportOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors hover:bg-background"
                >
                  <FileSpreadsheet className="h-4 w-4 text-muted" />
                  CSV
                </a>
                <a
                  href="/api/export/xlsx"
                  onClick={() => setExportOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors hover:bg-background"
                >
                  <FileSpreadsheet className="h-4 w-4 text-muted" />
                  Excel
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions slide-over */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-label="Quick Actions"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-0 top-0 z-[60] flex h-screen w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-muted" aria-hidden="true" />
                  <h2 className="text-sm font-semibold">Quick Actions</h2>
                  {urgent.length > 0 && (
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      {urgent.length} urgent
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {urgent.length > 0 && (
                  <div className="mb-5" role="list" aria-label="Urgent actions">
                    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-red-400/70">
                      Requires attention
                    </h3>
                    <div className="space-y-2">
                      {urgent.map((action, i) => (
                        <ActionItem key={`u-${i}`} action={action} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {other.length > 0 && (
                  <div role="list" aria-label="Recommendations">
                    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {other.map((action, i) => (
                        <ActionItem key={`o-${i}`} action={action} index={urgent.length + i} />
                      ))}
                    </div>
                  </div>
                )}

                {sorted.length === 0 && (
                  <p className="text-xs text-muted">No actions right now.</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-[10px] text-muted">AI-powered analysis</p>
                {onRefreshInsights && (
                  <button
                    type="button"
                    onClick={onRefreshInsights}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Analyzing…" : "Re-analyze"}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
