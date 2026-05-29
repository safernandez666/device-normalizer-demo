import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { shortSource } from "../lib/utils";

const PAGE_SIZE = 15;

interface PersonDevice {
  hostname: string;
  status: string;
  sources: string[];
  serial: string | null;
  os: string | null;
  confidence: number;
}

interface Person {
  email: string;
  is_employee: boolean | null;
  device_count: number;
  managed_count: number;
  has_edr: boolean;
  has_mdm: boolean;
  compliant: boolean;
  statuses: string[];
  devices: PersonDevice[];
}

interface PeopleResponse {
  total_people: number;
  compliant: number;
  non_compliant: number;
  total_employees: number;
  employees_compliant: number;
  employees_non_compliant: number;
  employees_no_device: number;
  people: Person[];
}

function PersonRow({ person }: { person: Person }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-border/50 transition-colors hover:bg-card/50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="p-3">
          {person.compliant
            ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
            : <ShieldAlert className="h-4 w-4 text-red-500" />}
        </td>
        <td className="p-3 font-medium text-xs">
          <div className="flex items-center gap-2">
            {person.email === "unassigned"
              ? <span className="italic text-muted">Unassigned ({person.device_count} devices)</span>
              : <span>{person.email}</span>}
            {person.is_employee === true && (
              <Badge variant="default" className="text-[9px]">Employee</Badge>
            )}
            {person.is_employee === false && person.email !== "unassigned" && (
              <Badge variant="warning" className="text-[9px]">Contractor</Badge>
            )}
          </div>
        </td>
        <td className="p-3 text-xs text-center">
          {person.device_count === 0
            ? <span className="text-red-500 font-medium">0</span>
            : person.device_count}
        </td>
        <td className="p-3 text-xs text-center">{person.managed_count}</td>
        <td className="p-3 text-center">
          <Badge variant={person.has_edr ? "success" : "error"}>
            {person.has_edr ? "Yes" : "No"}
          </Badge>
        </td>
        <td className="p-3 text-center">
          <Badge variant={person.has_mdm ? "success" : "error"}>
            {person.has_mdm ? "Yes" : "No"}
          </Badge>
        </td>
        <td className="p-3 text-center">
          <Badge variant={person.compliant ? "success" : "error"}>
            {person.compliant ? "Compliant" : "Non-compliant"}
          </Badge>
        </td>
        <td className="p-3 text-center text-muted">
          {expanded ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50">
          <td colSpan={8} className="p-0">
            <div className="bg-card/30 px-8 py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-muted uppercase">
                    <th className="pb-2 text-left font-medium">Hostname</th>
                    <th className="pb-2 text-left font-medium">OS</th>
                    <th className="pb-2 text-left font-medium">Serial</th>
                    <th className="pb-2 text-left font-medium">Sources</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {person.devices.map((d, i) => (
                    <tr key={i} className="border-t border-border/30">
                      <td className="py-2 text-muted">{d.hostname}</td>
                      <td className="py-2 text-muted">{d.os || "?"}</td>
                      <td className="py-2 font-mono text-[10px] text-muted">{d.serial || "?"}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {(d.sources || []).map((s) => (
                            <span key={s} className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-medium text-muted">
                              {shortSource(s)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`text-[10px] font-semibold ${
                          d.status === "MANAGED" || d.status === "FULLY_MANAGED" ? "text-emerald-500" :
                          d.status === "NO_EDR" || d.status === "NO_MDM" ? "text-red-500" : "text-amber-500"
                        }`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PeoplePage() {
  const [data, setData] = useState<PeopleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<"" | "compliant" | "non_compliant">("");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "employees" | "no_device">("all");
  const [sortCol, setSortCol] = useState<"email" | "devices" | "managed" | "compliance">("email");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Functional form so React batches the two setters correctly and the
  // handler stays idempotent under StrictMode's double-invocation.
  // Numeric columns default to desc on first click (most-devices-first is
  // the common ask); alpha defaults to asc.
  const toggleSort = (col: typeof sortCol) => {
    setSortCol((prevCol) => {
      setSortDir((prevDir) => {
        if (prevCol === col) return prevDir === "asc" ? "desc" : "asc";
        return col === "email" ? "asc" : "desc";
      });
      return col;
    });
    setPage(1);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/people");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Default to "employees only" once the backend has the Bamboo set — that's
  // the denominator that matches the compliance KPI. Stays "all" while the
  // group isn't synced yet so the page doesn't render empty on day one.
  const hasEmployeeData = (data?.total_employees ?? 0) > 0;
  useEffect(() => {
    if (hasEmployeeData && audienceFilter === "all") {
      setAudienceFilter("employees");
    }
  }, [hasEmployeeData]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const rows = data.people.filter((p) => {
      if (audienceFilter === "employees" && p.is_employee !== true) return false;
      if (audienceFilter === "no_device" && !(p.is_employee === true && p.device_count === 0)) return false;
      if (complianceFilter === "compliant" && !p.compliant) return false;
      if (complianceFilter === "non_compliant" && p.compliant) return false;
      if (q) {
        const emailMatch = p.email.toLowerCase().includes(q);
        const hostnameMatch = p.devices.some((d) => d.hostname.toLowerCase().includes(q));
        if (!emailMatch && !hostnameMatch) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sortCol) {
        case "devices":   av = a.device_count;  bv = b.device_count;  break;
        case "managed":   av = a.managed_count; bv = b.managed_count; break;
        case "compliance": av = a.compliant ? 1 : 0; bv = b.compliant ? 1 : 0; break;
        default:          av = a.email;        bv = b.email;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }, [data, search, complianceFilter, audienceFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <a href="/" className="rounded-lg p-2 hover:bg-card transition-colors" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">People</h1>
            <p className="text-xs text-muted">
              {!data ? "Loading..."
                : hasEmployeeData
                  ? `${data.employees_compliant} of ${data.total_employees} employees compliant · ${data.employees_no_device} with no device`
                  : `${data.compliant} compliant / ${data.non_compliant} non-compliant of ${data.total_people} users`}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Stats — employee-centric row first when Bamboo set is loaded */}
        {data && hasEmployeeData && (
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{data.total_employees}</div>
              <div className="text-xs text-muted">Employees</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{data.employees_compliant}</div>
              <div className="text-xs text-muted">Compliant</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{data.employees_non_compliant}</div>
              <div className="text-xs text-muted">Non-Compliant</div>
            </CardContent></Card>
            <Card>
              <CardContent
                className="p-4 text-center cursor-pointer hover:bg-card/60 transition-colors"
                onClick={() => { setAudienceFilter("no_device"); setPage(1); }}
              >
                <div className="text-2xl font-bold text-amber-500">{data.employees_no_device}</div>
                <div className="text-xs text-muted">No device assigned</div>
              </CardContent>
            </Card>
          </div>
        )}
        {data && !hasEmployeeData && (
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{data.total_people}</div>
              <div className="text-xs text-muted">Total Users</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{data.compliant}</div>
              <div className="text-xs text-muted">Compliant</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{data.non_compliant}</div>
              <div className="text-xs text-muted">Non-Compliant</div>
            </CardContent></Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Search email</label>
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="user@example.com"
                />
              </div>
              <div className="w-40">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Compliance</label>
                <Select value={complianceFilter} onChange={(e) => { setComplianceFilter(e.target.value as any); setPage(1); }}>
                  <option value="">All</option>
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                </Select>
              </div>
              {hasEmployeeData && (
                <div className="w-44">
                  <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Audience</label>
                  <Select value={audienceFilter} onChange={(e) => { setAudienceFilter(e.target.value as any); setPage(1); }}>
                    <option value="employees">Employees only</option>
                    <option value="no_device">No device assigned</option>
                    <option value="all">All (incl. contractors)</option>
                  </Select>
                </div>
              )}
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
                    <th className="p-3 w-8"></th>
                    <th
                      className="p-3 font-medium cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("email")}
                    >
                      Email {sortCol === "email" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 font-medium text-center cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("devices")}
                    >
                      Devices {sortCol === "devices" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 font-medium text-center cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("managed")}
                    >
                      Managed {sortCol === "managed" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 font-medium text-center">EDR</th>
                    <th className="p-3 font-medium text-center">MDM</th>
                    <th
                      className="p-3 font-medium text-center cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("compliance")}
                    >
                      Compliance {sortCol === "compliance" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={8} className="p-8 text-center text-muted">Loading...</td></tr>}
                  {!loading && pageItems.map((p) => <PersonRow key={p.email} person={p} />)}
                  {!loading && pageItems.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted">No users found</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border p-3">
              <span className="text-xs text-muted">
                {filtered.length > 0 ? start + 1 : 0}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
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
    </div>
  );
}
