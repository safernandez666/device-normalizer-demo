// Demo mock layer. Intercepts /api/* and /auth/* fetches and returns
// fabricated data so the app runs as a fully static site with no backend.
// EVERYTHING in this file is synthetic — no real devices, people, or orgs.
import type { Device, Summary, SyncRun, StatusSnapshot, TrendsResponse, Insight } from "../types";

/* ---- synthetic people pool ---- */
const PEOPLE_POOL: [string, string][] = [
  ["Maya Okonkwo", "maya.okonkwo@example.com"],
  ["Sam Tan", "sam.tan@example.com"],
  ["Elena Ruiz", "elena.ruiz@example.com"],
  ["Jonas Berg", "jonas.berg@example.com"],
  ["Priya Nair", "priya.nair@example.com"],
  ["Diego Salas", "diego.salas@example.com"],
  ["Aisha Khan", "aisha.khan@example.com"],
  ["Tomás Vega", "tomas.vega@example.com"],
  ["Hannah Cole", "hannah.cole@example.com"],
  ["Luca Romano", "luca.romano@example.com"],
];

const REGIONS = ["MX", "US", "DE"];
const NOW = Date.now();
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

/* ---- device generator ---- */
interface Spec { status: string; count: number; sources: string[]; os: string; conf: number; days: number; owned: boolean; }
const PLAN: Spec[] = [
  { status: "FULLY_MANAGED", count: 14, sources: ["crowdstrike", "jumpcloud", "okta"], os: "macOS", conf: 0.97, days: 1, owned: true },
  { status: "MANAGED", count: 11, sources: ["crowdstrike", "jumpcloud"], os: "Windows", conf: 0.92, days: 2, owned: true },
  { status: "NO_EDR", count: 6, sources: ["jumpcloud"], os: "Windows", conf: 0.84, days: 3, owned: true },
  { status: "NO_MDM", count: 5, sources: ["crowdstrike"], os: "macOS", conf: 0.8, days: 4, owned: true },
  { status: "IDP_ONLY", count: 4, sources: ["okta"], os: "Unknown", conf: 0.42, days: 6, owned: true },
  { status: "SERVER", count: 4, sources: ["crowdstrike"], os: "Linux", conf: 0.9, days: 1, owned: false },
  { status: "STALE", count: 3, sources: ["jumpcloud"], os: "macOS", conf: 0.55, days: 124, owned: true },
];

const OS_PREFIX: Record<string, string> = { macOS: "MB", Windows: "WIN", Linux: "SRV", Unknown: "DEV" };

function buildDevices(): Device[] {
  const out: Device[] = [];
  let n = 1;
  let p = 0;
  for (const spec of PLAN) {
    for (let i = 0; i < spec.count; i++) {
      const [name, email] = PEOPLE_POOL[p % PEOPLE_POOL.length];
      p++;
      const hostname = `ACME-${OS_PREFIX[spec.os] || "DEV"}-${String(n).padStart(3, "0")}`;
      const sourceIds: Record<string, string> = {};
      spec.sources.forEach((s, k) => { sourceIds[s] = `${s.slice(0, 2).toUpperCase()}-${1000 + n * 7 + k}`; });
      out.push({
        canonical_id: `dev-${String(n).padStart(4, "0")}`,
        hostnames: [hostname],
        serial_number: `SN${(900000 + n * 131).toString(36).toUpperCase()}`,
        mac_addresses: [`02:1a:${(n % 100).toString(16).padStart(2, "0")}:bc:de:${(n * 3 % 100).toString(16).padStart(2, "0")}`],
        owner_email: spec.owned ? email : null,
        owner_name: spec.owned ? name : null,
        os_type: spec.os === "Unknown" ? null : spec.os,
        sources: spec.sources,
        source_ids: sourceIds,
        status: spec.status,
        confidence_score: Math.round((spec.conf - (i % 3) * 0.04) * 100) / 100,
        match_reason: spec.sources.length > 1 ? "serial + hostname match" : "single-source",
        is_active_vpn: false,
        coverage_gaps: spec.status === "NO_EDR" ? ["edr"] : spec.status === "NO_MDM" ? ["mdm"] : [],
        days_since_seen: spec.days,
        first_seen: iso(1000 * 60 * 60 * 24 * 200),
        last_seen: iso(1000 * 60 * 60 * 24 * spec.days),
        deleted_at: null,
        region: spec.status === "SERVER" ? "US" : REGIONS[n % REGIONS.length],
        timezone: null,
      });
      n++;
    }
  }
  return out;
}

const DEVICES = buildDevices();

function tally(key: (d: Device) => string | null | undefined): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const d of DEVICES) { const k = key(d); if (k) acc[k] = (acc[k] || 0) + 1; }
  return acc;
}

const byStatus = tally((d) => d.status);
const bySource: Record<string, number> = {};
for (const d of DEVICES) for (const s of d.sources) bySource[s] = (bySource[s] || 0) + 1;
const byOs = tally((d) => d.os_type || "Unknown");
const byRegion = tally((d) => d.region);
const endpointTotal = DEVICES.filter((d) => d.status !== "SERVER").length;

const SUMMARY: Summary = {
  by_status: byStatus,
  by_source: bySource,
  by_os: byOs,
  by_region: byRegion,
  endpoint_total: endpointTotal,
  total: DEVICES.length,
  risk_score: 72,
  syncing: false,
  next_sync: iso(-1000 * 60 * 60 * 4),
  sync_interval_hours: 6,
};

/* ---- sync state (so the Sync button actually completes) ---- */
let syncId = 7;
const lastSync = (): SyncRun => ({
  id: syncId,
  started_at: iso(1000 * 60 * 9),
  finished_at: iso(1000 * 60 * 8),
  status: "success",
  total_raw_devices: DEVICES.length + 12,
  duplicates_removed: 12,
  final_count: DEVICES.length,
  sources_ok: ["crowdstrike", "jumpcloud", "okta"],
  sources_failed: [],
});

/* ---- history (trend over recent syncs) ---- */
const HISTORY: StatusSnapshot[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  sync_run_id: i + 1,
  recorded_at: iso(1000 * 60 * 60 * 24 * (8 - i)),
  total: DEVICES.length - (7 - i),
  fully_managed: (byStatus.FULLY_MANAGED || 0) - (7 - i),
  managed: byStatus.MANAGED || 0,
  no_edr: (byStatus.NO_EDR || 0) + (i < 4 ? 2 : 0),
  no_mdm: byStatus.NO_MDM || 0,
  idp_only: byStatus.IDP_ONLY || 0,
  stale: byStatus.STALE || 0,
  unknown: 0,
  server: byStatus.SERVER || 0,
}));

const TRENDS: TrendsResponse = {
  trends: { FULLY_MANAGED: 3, MANAGED: 1, NO_EDR: -2, NO_MDM: -1, IDP_ONLY: 0, SERVER: 0, STALE: 1 },
  has_previous: true,
};

const INSIGHTS: Insight[] = [
  { priority: "critical", title: `${byStatus.NO_EDR || 0} devices without EDR`, description: "Endpoints enrolled in MDM but missing the EDR agent. Deploy the sensor via the MDM command channel." },
  { priority: "high", title: `${byStatus.NO_MDM || 0} devices without MDM`, description: "Have EDR but aren't enrolled in MDM — IT can't push policy or wipe. Trigger enrollment." },
  { priority: "high", title: `${byStatus.IDP_ONLY || 0} IDP-only devices`, description: "Only seen in the identity provider. Likely BYOD or shadow IT — review and classify." },
  { priority: "medium", title: `${byStatus.STALE || 0} stale devices`, description: "No activity in 90+ days. Candidates for offboarding cleanup." },
  { priority: "success", title: "All sources healthy", description: "Last sync collected from CrowdStrike, JumpCloud and Okta with no failures." },
];

/* ---- controls ---- */
function ctlDevices(status: string, k: number) {
  return DEVICES.filter((d) => d.status === status).slice(0, k).map((d) => ({
    canonical_id: d.canonical_id,
    hostname: d.hostnames[0],
    serial: d.serial_number,
    owner: d.owner_name || "—",
    status: d.status,
    sources: d.sources,
    last_seen: d.last_seen,
    days_since_seen: d.days_since_seen,
  }));
}
const CONTROLS = {
  summary: { total: 8, passing: 5, failing: 3 },
  controls: [
    { id: "CTL-002", ref: "KRI0021", title: "MDM without EDR", objective: "Every managed endpoint runs the EDR sensor", source_from: "jumpcloud", source_to: "crowdstrike", description: "Devices in MDM but missing EDR.", status: "fail", total: DEVICES.length, affected: byStatus.NO_EDR || 0, devices: ctlDevices("NO_EDR", 6) },
    { id: "CTL-005", ref: "CIS0102", title: "Users without a device", objective: "Every active user maps to at least one managed device", source_from: "okta", source_to: "jumpcloud", description: "Identity-only users with no enrolled device.", status: "fail", total: DEVICES.length, affected: byStatus.IDP_ONLY || 0, devices: ctlDevices("IDP_ONLY", 4) },
    { id: "CTL-007", ref: "CIS0101", title: "MDM not reporting", objective: "MDM agents check in within SLA", source_from: "jumpcloud", source_to: "", description: "Enrolled devices that stopped reporting.", status: "pass", total: DEVICES.length, affected: 0, devices: [] },
    { id: "CTL-008", ref: "KRI0022", title: "EDR not reporting", objective: "EDR sensors check in within SLA", source_from: "crowdstrike", source_to: "", description: "Sensors that went silent.", status: "fail", total: DEVICES.length, affected: byStatus.STALE || 0, devices: ctlDevices("STALE", 3) },
    { id: "CTL-009", ref: "CIS0140", title: "Per-source agent dormancy", objective: "No agent dormant beyond 10 days", source_from: "crowdstrike", source_to: "jumpcloud", description: "Agents inactive 10+ days on any source.", status: "pass", total: DEVICES.length, affected: 0, devices: [] },
    { id: "CTL-010", ref: "CIS0103", title: "MDM without IDP", objective: "Managed devices map to an identity", source_from: "jumpcloud", source_to: "okta", description: "Managed devices with no matching identity.", status: "pass", total: DEVICES.length, affected: 0, devices: [] },
    { id: "CTL-011", ref: "KRI0030", title: "Zombie devices", objective: "No device active in EDR but absent from MDM", source_from: "crowdstrike", source_to: "jumpcloud", description: "Active EDR, missing from MDM.", status: "fail", total: DEVICES.length, affected: byStatus.NO_MDM || 0, devices: ctlDevices("NO_MDM", 5) },
    { id: "CTL-012", ref: "CIS0150", title: "Server EDR coverage", objective: "Every server runs EDR", source_from: "crowdstrike", source_to: "", description: "Servers without the EDR sensor.", status: "pass", total: byStatus.SERVER || 0, affected: 0, devices: [] },
  ],
};

/* ---- diff (changes since last sync) ---- */
const DIFF = {
  total_current: DEVICES.length,
  status_changes: {
    NO_EDR: { previous: (byStatus.NO_EDR || 0) + 2, current: byStatus.NO_EDR || 0, delta: -2 },
    FULLY_MANAGED: { previous: (byStatus.FULLY_MANAGED || 0) - 3, current: byStatus.FULLY_MANAGED || 0, delta: 3 },
  },
  new_devices: { count: 2, devices: [
    { hostname: "ACME-MB-201", owner: "Hannah Cole", status: "MANAGED", sources: ["crowdstrike", "jumpcloud"] },
    { hostname: "ACME-WIN-202", owner: "Luca Romano", status: "NO_EDR", sources: ["jumpcloud"] },
  ] },
  disappeared: { count: 1, devices: [
    { hostname: "ACME-MB-088", owner: "Diego Salas", status: "STALE", sources: ["jumpcloud"] },
  ] },
  newly_stale: { count: 1, devices: [
    { hostname: "ACME-MB-077", owner: "Aisha Khan", status: "STALE" },
  ] },
};

/* ---- people ---- */
function personFrom(d: Device) {
  return {
    email: d.owner_email || "unassigned",
    is_employee: d.status !== "IDP_ONLY",
    device_count: 1,
    managed_count: d.status === "FULLY_MANAGED" || d.status === "MANAGED" ? 1 : 0,
    has_edr: d.sources.includes("crowdstrike"),
    has_mdm: d.sources.includes("jumpcloud"),
    compliant: d.status === "FULLY_MANAGED" || d.status === "MANAGED",
    statuses: [d.status],
    devices: [{ hostname: d.hostnames[0], status: d.status, sources: d.sources, serial: d.serial_number, os: d.os_type, confidence: d.confidence_score }],
  };
}
const PEOPLE_OWNED = DEVICES.filter((d) => d.owner_email).slice(0, 24).map(personFrom);
const PEOPLE = {
  total_people: PEOPLE_OWNED.length,
  compliant: PEOPLE_OWNED.filter((p) => p.compliant).length,
  non_compliant: PEOPLE_OWNED.filter((p) => !p.compliant).length,
  total_employees: PEOPLE_OWNED.filter((p) => p.is_employee).length,
  employees_compliant: PEOPLE_OWNED.filter((p) => p.is_employee && p.compliant).length,
  employees_non_compliant: PEOPLE_OWNED.filter((p) => p.is_employee && !p.compliant).length,
  employees_no_device: 2,
  people: PEOPLE_OWNED,
};

/* ---- dual-use ---- */
const DUAL_USE = {
  dual_use_count: 2,
  total_users_with_devices: PEOPLE_OWNED.length,
  users: [
    { email: "maya.okonkwo@example.com", corporate_devices: [{ hostname: "ACME-MB-001", status: "FULLY_MANAGED", sources: ["crowdstrike", "jumpcloud", "okta"], serial: "SN-001", os: "macOS" }], personal_devices: [{ hostname: "iPhone-Maya", status: "IDP_ONLY", serial: null, os: "iOS" }] },
    { email: "diego.salas@example.com", corporate_devices: [{ hostname: "ACME-WIN-016", status: "MANAGED", sources: ["crowdstrike", "jumpcloud"], serial: "SN-016", os: "Windows" }], personal_devices: [{ hostname: "Pixel-Diego", status: "IDP_ONLY", serial: null, os: "Android" }] },
  ],
};

/* ---- settings ---- */
const settings = () => ({
  sync_interval_hours: 6,
  syncing: false,
  version: "1.0.0-demo",
  build_date: iso(1000 * 60 * 60 * 24 * 3),
  app_url: "https://example.com",
  sources: {
    crowdstrike: { configured: true, name: "CrowdStrike" },
    jumpcloud: { configured: true, name: "JumpCloud" },
    okta: { configured: true, name: "Okta" },
  },
  last_runs: [lastSync()],
});

/* ---- full report (PDF export) ---- */
const FULL_REPORT = {
  generated_at: new Date().toISOString(),
  summary: { total: DEVICES.length, by_status: byStatus, by_source: bySource, risk_score: 72 },
  executive_summary: "# Fleet Coverage\n\nThe fleet is **72/100** — solid baseline coverage with a few gaps.\n\n- EDR and MDM cover the majority of endpoints.\n- A handful of devices are missing one control layer.\n- No source collection failures in the last sync.",
  actions: INSIGHTS,
  categories: {
    no_edr: { title: "Missing EDR", count: byStatus.NO_EDR || 0, devices: ctlDevices("NO_EDR", 6) },
    no_mdm: { title: "Missing MDM", count: byStatus.NO_MDM || 0, devices: ctlDevices("NO_MDM", 5) },
  },
  unique_matches: { title: "Cross-source matches", count: byStatus.FULLY_MANAGED || 0, devices: ctlDevices("FULLY_MANAGED", 5) },
  low_confidence: { title: "Low confidence", count: byStatus.IDP_ONLY || 0, devices: ctlDevices("IDP_ONLY", 4) },
};

/* ---- AI assistant canned replies ---- */
function aiReply(messages: { role: string; content: string }[]): { reply: string; in_scope: boolean } {
  const last = (messages[messages.length - 1]?.content || "").toLowerCase();
  if (last.includes("edr")) return { reply: `There are ${byStatus.NO_EDR || 0} devices in MDM that are missing the EDR sensor. (Demo data.)`, in_scope: true };
  if (last.includes("risk")) return { reply: "The current fleet risk score is 72/100 — a solid baseline with a few coverage gaps. (Demo data.)", in_scope: true };
  if (last.includes("idp")) return { reply: "IDP_ONLY means a device is only seen in the identity provider (Okta) — no MDM or EDR. Often BYOD or shadow IT. (Demo data.)", in_scope: true };
  if (last.includes("mexico") || last.includes("region") || last.includes("mx")) return { reply: `By region: ${Object.entries(byRegion).map(([k, v]) => `${k} ${v}`).join(", ")}. (Demo data.)`, in_scope: true };
  if (last.includes("stale")) return { reply: `${byStatus.STALE || 0} devices have been inactive 90+ days. (Demo data.)`, in_scope: true };
  return { reply: "This is a demo assistant. I can answer questions about device inventory, sources (CrowdStrike / JumpCloud / Okta), statuses and coverage. Try one of the suggested questions.", in_scope: false };
}

/* ---- fetch interceptor ---- */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const realFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];

  if (!path.startsWith("/api/") && !path.startsWith("/auth/")) {
    return realFetch(input, init);
  }

  await new Promise((r) => setTimeout(r, 140)); // small latency so it feels real

  if (path === "/api/sync/trigger") { syncId += 1; return json({ message: "Sync started (demo)", started: true }); }
  if (path === "/auth/me") return json({ user: "demo" });
  if (path === "/api/summary") return json(SUMMARY);
  if (/^\/api\/devices\/[^/]+\/ack$/.test(path)) return json({ ok: true });
  if (path === "/api/devices") return json({ devices: DEVICES, total: DEVICES.length, page: 1, page_size: DEVICES.length, total_pages: 1 });
  if (path === "/api/sync/last") return json({ last_sync: lastSync() });
  if (path === "/api/history") return json({ history: HISTORY });
  if (path === "/api/trends") return json(TRENDS);
  if (path === "/api/insights") return json({ actions: INSIGHTS });
  if (path === "/api/report") return json({ report: FULL_REPORT.executive_summary });
  if (path === "/api/report/full") return json(FULL_REPORT);
  if (path === "/api/diff") return json(DIFF);
  if (path === "/api/controls") return json(CONTROLS);
  if (path === "/api/people") return json(PEOPLE);
  if (path === "/api/dual-use") return json(DUAL_USE);
  if (path === "/api/settings") return json(settings());
  if (path === "/api/settings/sync-interval") return json({ ok: true, rescheduled: true });
  if (path === "/api/slack/test") return json({ ok: true });
  if (path === "/api/jumpcloud/reconcile-displaynames") return json({ scanned: DEVICES.length, drifted: 0, updated: 0, failed: 0, capped: 0, dry_run: true, devices_refreshed: DEVICES.length, new_hostnames: 0 });
  if (path === "/api/ai/chat") {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    return json(aiReply(body.messages || []));
  }

  return json({ error: "Not found (demo mock)" }, 404);
};

export {};
