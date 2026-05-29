import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { List, ChevronLeft, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { DeviceDetail, DeviceDetailHeader } from "./device-detail";
import { formatDate, pickHostname, shortSource } from "../lib/utils";
import { api } from "../lib/api";
import type { Device } from "../types";

const PAGE_SIZES = [10, 25, 50, 100];

type SortKey = "owner" | "hostname" | "serial" | "os" | "status" | "last_seen" | "confidence";
type SortOrder = "asc" | "desc";

const COLUMNS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: "owner", label: "Owner" },
  { key: "hostname", label: "Hostname" },
  { key: "serial", label: "Serial" },
  { key: "os", label: "OS" },
  { key: null, label: "Sources" },
  { key: "status", label: "Status" },
  { key: "last_seen", label: "Last Seen" },
  { key: "confidence", label: "Confidence", align: "right" },
];

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

export function DeviceInventory() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchDevices = useCallback(
    async (
      p: number,
      ps: number,
      status: string,
      q: string,
      sk: SortKey | null,
      so: SortOrder,
      region: string,
    ) => {
      setLoading(true);
      try {
        const res = await api.getDevicesPaginated({
          status: status || null,
          search: q || null,
          page: p,
          pageSize: ps,
          sort: sk,
          order: sk ? so : null,
          region: region || null,
        });
        setDevices(res.devices || []);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (e: any) {
        if (e?.message === "Unauthorized") {
          window.location.href = "/auth/logout";
          return;
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDevices(page, pageSize, statusFilter, search, sortKey, sortOrder, regionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, sortKey, sortOrder, regionFilter]);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchDevices(1, pageSize, statusFilter, value, sortKey, sortOrder, regionFilter);
    }, 300);
  };

  // Click cycles: unsorted → desc → asc → unsorted
  const handleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortOrder("asc");
    } else {
      setSortKey(null);
      setSortOrder("desc");
    }
  };

  const start = (page - 1) * pageSize;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-accent" aria-hidden="true" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
              Device Inventory
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by region"
              className="w-40"
            >
              <option value="">All regions</option>
              <option value="MX">México</option>
              <option value="AR">Argentina</option>
              <option value="DE">Germany</option>
              <option value="OT">Other</option>
              <option value="UNKNOWN">Unknown</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-44"
            >
              <option value="">All statuses</option>
              <option value="FULLY_MANAGED">FULLY MANAGED</option>
              <option value="MANAGED">MANAGED</option>
              <option value="NO_EDR">NO EDR</option>
              <option value="NO_MDM">NO MDM</option>
              <option value="IDP_ONLY">IDP ONLY</option>
              <option value="SERVER">SERVER/VM</option>
              <option value="STALE">STALE</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </Select>
            <Input
              type="search"
              name="device-search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search owner, hostname or serial…"
              aria-label="Search devices"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  {COLUMNS.map((col) => {
                    const isActive = col.key !== null && sortKey === col.key;
                    const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : col.key ? "none" : undefined;
                    const Icon = isActive ? (sortOrder === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                    const alignRight = col.align === "right";
                    return (
                      <th
                        key={col.label}
                        scope="col"
                        aria-sort={ariaSort}
                        className={`pb-3 font-medium ${alignRight ? "text-right" : ""}`}
                      >
                        {col.key ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key as SortKey)}
                            className={`inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${alignRight ? "ml-auto" : ""} ${isActive ? "text-foreground" : ""}`}
                            aria-label={`Sort by ${col.label}${isActive ? ` (currently ${sortOrder === "asc" ? "ascending" : "descending"})` : ""}`}
                          >
                            {col.label}
                            <Icon className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-40"}`} aria-hidden="true" />
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={loading ? "opacity-50" : ""}>
                {devices.map((d) => {
                  const cfg = STATUS_BADGES[d.status] || STATUS_BADGES.UNKNOWN;
                  const isRisk = d.status === "NO_EDR" || d.status === "NO_MDM" || d.status === "IDP_ONLY";
                  const { primary, aliases } = pickHostname(d.hostnames);
                  const hostname = primary || d.serial_number || "device";
                  const open = () => setSelectedDevice(d);
                  return (
                    <tr
                      key={d.canonical_id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${hostname}`}
                      onClick={open}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open();
                        }
                      }}
                      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-card/50 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                        isRisk ? "bg-red-500/[0.02]" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium">{d.owner_email || "N/A"}</div>
                        {d.owner_name && (
                          <div className="text-xs text-muted">{d.owner_name}</div>
                        )}
                      </td>
                      <td className="max-w-[220px] py-3 pr-4 text-muted">
                        <div
                          className="flex items-center gap-1.5 truncate"
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
                            <span
                              key={s}
                              aria-label={s}
                              className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-medium text-muted"
                            >
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
                      <td className="py-3 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-1">
                          {d.match_reason?.startsWith("ai_match") && (
                            <span
                              className="group relative"
                              tabIndex={0}
                              aria-label={`AI matched: ${d.match_reason.replace("ai_match:", "")}`}
                            >
                              <Sparkles className="h-3 w-3 text-violet-400" aria-hidden="true" />
                              <span className="pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded bg-card border border-border px-2 py-1 text-[10px] text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                AI matched: {d.match_reason.replace("ai_match:", "")}
                              </span>
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold ${
                              d.confidence_score >= 0.8
                                ? "text-emerald-400"
                                : d.confidence_score >= 0.5
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {d.confidence_score?.toFixed(2) ?? "0.00"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {devices.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted">
                      No devices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Showing {total > 0 ? start + 1 : 0}–{Math.min(start + pageSize, total)} of {total}
              </span>
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="w-20 text-xs"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={String(s)}>{s}/page</option>
                ))}
              </Select>
            </div>
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
              <span
                className="text-xs text-muted"
                aria-live="polite"
                aria-atomic="true"
              >
                Page {page} of {totalPages}
              </span>
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
      <Dialog
        open={selectedDevice !== null}
        onClose={() => setSelectedDevice(null)}
        title={selectedDevice && <DeviceDetailHeader device={selectedDevice} />}
      >
        {selectedDevice && <DeviceDetail device={selectedDevice} />}
      </Dialog>
    </motion.div>
  );
}
