import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { api } from "../lib/api";

interface ControlDevice {
  canonical_id: string;
  hostname: string;
  serial: string | null;
  owner: string;
  status: string;
  sources: string[];
  last_seen: string;
  days_since_seen: number | null;
}

interface Control {
  id: string;
  ref: string;
  title: string;
  objective: string;
  source_from: string;
  source_to: string;
  description: string;
  status: "pass" | "fail";
  total: number;
  affected: number;
  devices: ControlDevice[];
}

interface ControlsResponse {
  controls: Control[];
  summary: { total: number; passing: number; failing: number };
}

const SOURCE_ICON: Record<string, { label: string; color: string }> = {
  okta: { label: "Okta", color: "text-blue-400" },
  jumpcloud: { label: "JumpCloud", color: "text-emerald-400" },
  crowdstrike: { label: "CrowdStrike", color: "text-red-400" },
};

const STATUS_COLOR: Record<string, string> = {
  FULLY_MANAGED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  MANAGED: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
  NO_EDR: "bg-red-500/15 text-red-400 border-red-500/30",
  NO_MDM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  IDP_ONLY: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  STALE: "bg-neutral-500/15 text-neutral-500 border-neutral-500/30",
  SERVER: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

function ControlCard({ control }: { control: Control }) {
  const [expanded, setExpanded] = useState(false);
  const pass = control.status === "pass";
  // Don't let Math.round paint "100% OK" when there's still 1 affected out of
  // a few hundred — `1 / 301 → 0.33%` rounds to 0 and the label flips to a
  // false-clean state. Reserve the "100% OK" string for the zero-affected
  // case; otherwise show one decimal so single-digit affecteds stay visible.
  const passRatio = control.total > 0 ? (control.total - control.affected) / control.total : 1;
  const pctNum = passRatio * 100;
  const pctLabel = control.affected === 0 ? "100% OK" : `${pctNum.toFixed(1)}% OK`;
  const pctBar = Math.min(100, pctNum);

  return (
    <div className={`rounded-xl border ${pass ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-red-500/20 bg-red-500/[0.03]"} transition-all`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
      >
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={`mt-0.5 shrink-0 ${pass ? "text-emerald-500" : "text-red-500"}`}>
            {pass ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider text-muted bg-card px-1.5 py-0.5 rounded border border-border">
                {control.id}
              </span>
              {control.ref && (
                <span className="text-[10px] font-medium tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {control.ref}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-sm font-semibold">{control.title}</h3>
            <p className="mt-0.5 text-xs text-muted">{control.objective}</p>

            {/* Source flow */}
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              {control.source_from && (
                <span className={SOURCE_ICON[control.source_from]?.color || "text-muted"}>
                  {SOURCE_ICON[control.source_from]?.label || control.source_from}
                </span>
              )}
              {control.source_to && (
                <>
                  <ArrowRight className="h-3 w-3 text-muted/50" />
                  <span className={SOURCE_ICON[control.source_to]?.color || "text-muted"}>
                    {SOURCE_ICON[control.source_to]?.label || control.source_to}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="shrink-0 text-right">
            <div className={`text-2xl font-bold tabular-nums ${pass ? "text-emerald-400" : "text-red-400"}`}>
              {control.affected}
            </div>
            <div className="text-[10px] text-muted">de {control.total}</div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 w-20 rounded-full bg-card overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pass ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${pctBar}%` }}
              />
            </div>
            <div className="mt-0.5 text-[10px] text-muted">{pctLabel}</div>
          </div>

          {/* Expand */}
          <div className="shrink-0 mt-1 text-muted/40">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4">
          {control.description && (
            <div className="mt-3 mb-3 rounded-lg bg-card/80 border border-border/50 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-muted">{control.description}</p>
            </div>
          )}

          {control.devices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr className="text-muted text-[10px] uppercase tracking-wider">
                      <th className="text-left p-2 font-medium">Hostname</th>
                      <th className="text-left p-2 font-medium">Owner</th>
                      <th className="text-left p-2 font-medium">Serial</th>
                      <th className="text-left p-2 font-medium">Sources</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-right p-2 font-medium">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {control.devices.map((d) => (
                      <tr key={d.canonical_id} className="border-t border-border/30 hover:bg-card/30">
                        <td className="p-2 font-medium max-w-[200px] truncate">{d.hostname}</td>
                        <td className="p-2 text-muted">{d.owner}</td>
                        <td className="p-2 text-muted font-mono text-[10px]">{d.serial || "—"}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            {d.sources.map(s => (
                              <span key={s} className={`text-[9px] font-bold px-1 py-0.5 rounded ${SOURCE_ICON[s]?.color || "text-muted"} bg-card border border-border`}>
                                {s === "crowdstrike" ? "CS" : s === "jumpcloud" ? "JC" : "OKT"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLOR[d.status] || "bg-card text-muted border-border"}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-2 text-right text-muted whitespace-nowrap">
                          {d.days_since_seen != null ? `${d.days_since_seen}d ago` : d.last_seen ? new Date(d.last_seen).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {control.affected > control.devices.length && (
                <p className="mt-2 text-[10px] text-muted text-center">
                  Mostrando {control.devices.length} de {control.affected} dispositivos afectados
                </p>
              )}
            </>
          ) : (
            <div className="py-4 text-center text-xs text-muted">
              Sin dispositivos afectados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ControlsPage() {
  const [data, setData] = useState<ControlsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "fail" | "pass">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getControls();
      setData(res);
    } catch (e: any) {
      if (e?.message === "Unauthorized") {
        window.location.href = "/auth/logout";
        return;
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data?.controls.filter(c => filter === "all" || c.status === filter) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted">Loading controls...</div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-bg p-6 md:p-10">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <h1 className="text-xl font-bold tracking-tight">Compliance Controls</h1>
        </div>
        <p className="text-sm text-muted mb-6">
          8 controles de seguridad cruzando Okta, JumpCloud y CrowdStrike
        </p>

        {/* Summary cards */}
        {s && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl border p-4 text-center transition-all ${filter === "all" ? "border-accent bg-accent/5" : "border-border bg-card/50 hover:bg-card"}`}
            >
              <div className="text-2xl font-bold">{s.total}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted mt-1">Total</div>
            </button>
            <button
              onClick={() => setFilter("pass")}
              className={`rounded-xl border p-4 text-center transition-all ${filter === "pass" ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-card/50 hover:bg-card"}`}
            >
              <div className="text-2xl font-bold text-emerald-400">{s.passing}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted mt-1">Passing</div>
            </button>
            <button
              onClick={() => setFilter("fail")}
              className={`rounded-xl border p-4 text-center transition-all ${filter === "fail" ? "border-red-500 bg-red-500/5" : "border-border bg-card/50 hover:bg-card"}`}
            >
              <div className="text-2xl font-bold text-red-400">{s.failing}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted mt-1">Failing</div>
            </button>
          </div>
        )}

        {/* Controls list */}
        <div className="space-y-3">
          {filtered.map(control => (
            <ControlCard key={control.id} control={control} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted text-sm">
            {filter === "pass" ? "No hay controles pasando" : filter === "fail" ? "Todos los controles pasan" : "No hay controles"}
          </div>
        )}
      </div>
    </div>
  );
}
