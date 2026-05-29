import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  X,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { formatDate, pickHostname, shortSource, normalizeOs } from "../lib/utils";
import { api } from "../lib/api";
import type { Device } from "../types";

const PAGE_SIZE = 15;

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

interface AckModalProps {
  device: Device;
  onClose: () => void;
  onAck: (id: string, reason: string) => void;
}

function AckModal({ device, onClose, onAck }: AckModalProps) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Acknowledge Device</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-card">
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
        <p className="text-xs text-muted mb-1">
          <strong>{pickHostname(device.hostnames).primary || "Unknown"}</strong> — {device.owner_email || "No owner"}
        </p>
        <p className="text-xs text-muted mb-4">
          This device will be excluded from metrics, reports, and Quick Actions.
        </p>
        <label className="block text-xs font-medium text-muted mb-1">Reason</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Contingency machine, test device, decommissioned..."
          className="mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onAck(device.canonical_id, reason)}>Acknowledge</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [osFilter, setOsFilter] = useState("");
  const [ackFilter, setAckFilter] = useState<"" | "acked" | "not_acked">("");
  const [page, setPage] = useState(1);
  const [ackModal, setAckModal] = useState<Device | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDevices();
      setDevices(res.devices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const STATUS_ORDER: Record<string, number> = {
    NO_EDR: 0, NO_MDM: 1, IDP_ONLY: 2, STALE: 3, MANAGED: 4, FULLY_MANAGED: 5, SERVER: 6, UNKNOWN: 7,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (sourceFilter && !(d.sources || []).includes(sourceFilter)) return false;
      if (osFilter && normalizeOs(d.os_type) !== osFilter) return false;
      if (ackFilter === "acked" && !(d as any).acknowledged) return false;
      if (ackFilter === "not_acked" && (d as any).acknowledged) return false;
      if (q) {
        const fields = [
          d.owner_email, d.owner_name, d.serial_number, d.os_type,
          d.status, d.match_reason, d.canonical_id,
          ...(d.hostnames || []), ...(d.sources || []),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!fields.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  }, [devices, search, statusFilter, sourceFilter, osFilter, ackFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const uniqueOs = useMemo(() => {
    const s = new Set(devices.map((d) => normalizeOs(d.os_type)));
    return [...s].sort();
  }, [devices]);

  const handleAck = useCallback(async (id: string, reason: string) => {
    try {
      await fetch(`/api/devices/${id}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, by: "admin" }),
      });
      setAckModal(null);
      loadDevices();
    } catch (e) {
      console.error(e);
    }
  }, [loadDevices]);

  const handleUnack = useCallback(async (id: string) => {
    try {
      await fetch(`/api/devices/${id}/ack`, { method: "DELETE" });
      loadDevices();
    } catch (e) {
      console.error(e);
    }
  }, [loadDevices]);

  const ackCount = devices.filter((d) => (d as any).acknowledged).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <a href="/" className="rounded-lg p-2 hover:bg-card transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Asset Search</h1>
            <p className="text-xs text-muted">{filtered.length} of {devices.length} devices{ackCount > 0 ? ` — ${ackCount} acknowledged` : ""}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Search all fields</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="hostname, serial, owner, OS..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-36">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Status</label>
                <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  <option value="FULLY_MANAGED">Fully Managed</option>
                  <option value="MANAGED">Managed</option>
                  <option value="NO_EDR">No EDR</option>
                  <option value="NO_MDM">No MDM</option>
                  <option value="IDP_ONLY">IDP Only</option>
                  <option value="SERVER">Server/VM</option>
                  <option value="STALE">Stale</option>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Source</label>
                <Select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  <option value="crowdstrike">CrowdStrike</option>
                  <option value="jumpcloud">JumpCloud</option>
                  <option value="okta">Okta</option>
                </Select>
              </div>
              <div className="w-28">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">OS</label>
                <Select value={osFilter} onChange={(e) => { setOsFilter(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  {uniqueOs.map((os) => <option key={os} value={os!}>{os}</option>)}
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Acknowledged</label>
                <Select value={ackFilter} onChange={(e) => { setAckFilter(e.target.value as any); setPage(1); }}>
                  <option value="">All</option>
                  <option value="acked">Acknowledged</option>
                  <option value="not_acked">Not Acked</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="p-3 font-medium w-8"></th>
                    <th className="p-3 font-medium">Hostname</th>
                    <th className="p-3 font-medium">Owner</th>
                    <th className="p-3 font-medium">Serial</th>
                    <th className="p-3 font-medium">OS</th>
                    <th className="p-3 font-medium">Sources</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Confidence</th>
                    <th className="p-3 font-medium">Last Seen</th>
                    <th className="p-3 font-medium text-center">Ack</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted">Loading...</td></tr>
                  )}
                  {!loading && pageItems.map((d) => {
                    const cfg = STATUS_BADGES[d.status] || STATUS_BADGES.UNKNOWN;
                    const acked = (d as any).acknowledged;
                    const { primary, aliases } = pickHostname(d.hostnames);
                    return (
                      <tr
                        key={d.canonical_id}
                        className={`border-b border-border/50 transition-colors hover:bg-card/50 ${acked ? "opacity-50" : ""}`}
                      >
                        <td className="p-3">
                          {acked && <ShieldOff className="h-3.5 w-3.5 text-muted" />}
                        </td>
                        <td className="p-3">
                          <div
                            className="flex items-center gap-1.5"
                            title={aliases.length ? `Aliases: ${aliases.join(", ")}` : undefined}
                          >
                            <span className="font-medium text-xs">{primary || "N/A"}</span>
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
                        <td className="p-3">
                          <div className="text-xs">{d.owner_email || "N/A"}</div>
                          {d.owner_name && <div className="text-[10px] text-muted">{d.owner_name}</div>}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted">{d.serial_number || "N/A"}</td>
                        <td className="p-3 text-xs text-muted">{normalizeOs(d.os_type)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {(d.sources || []).map((s) => (
                              <span key={s} className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-medium text-muted">{shortSource(s)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {d.match_reason?.startsWith("ai_match") && (
                              <span className="group relative">
                                <Sparkles className="h-3 w-3 text-violet-400" />
                                <span className="pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded bg-card border border-border px-2 py-1 text-[10px] text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
                                  AI: {d.match_reason.replace("ai_match:", "")}
                                </span>
                              </span>
                            )}
                            <span className={`text-xs font-semibold ${d.confidence_score >= 0.8 ? "text-emerald-500" : d.confidence_score >= 0.5 ? "text-amber-500" : "text-red-500"}`}>
                              {d.confidence_score?.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-[10px] text-muted">{formatDate(d.last_seen)}</td>
                        <td className="p-3 text-center">
                          {acked ? (
                            <button
                              onClick={() => handleUnack(d.canonical_id)}
                              className="rounded border border-border px-2 py-1 text-[10px] text-muted hover:bg-card transition-colors"
                              title={`Reason: ${(d as any).ack_reason || "N/A"}`}
                            >
                              Undo
                            </button>
                          ) : (
                            <button
                              onClick={() => setAckModal(d)}
                              className="rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              Ack
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && pageItems.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted">No devices found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border p-3">
              <span className="text-xs text-muted">
                {filtered.length > 0 ? start + 1 : 0}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <AnimatePresence>
        {ackModal && <AckModal device={ackModal} onClose={() => setAckModal(null)} onAck={handleAck} />}
      </AnimatePresence>
    </div>
  );
}
