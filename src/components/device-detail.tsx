import { Sparkles, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDate, shortSource } from "../lib/utils";
import type { Device } from "../types";

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

const GAP_LABELS: Record<string, string> = {
  missing_edr: "Missing EDR (CrowdStrike)",
  missing_mdm: "Missing MDM (JumpCloud)",
  missing_idp: "Missing IDP (Okta)",
};

const SOURCE_NAMES: Record<string, string> = {
  crowdstrike: "CrowdStrike",
  jumpcloud: "JumpCloud",
  okta: "Okta",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="border-b border-border/60 px-6 py-4 last:border-b-0">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}

function Row({ label, children, mono }: RowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-1 text-sm">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{children}</dd>
    </div>
  );
}

interface DeviceDetailHeaderProps {
  device: Device;
}

export function DeviceDetailHeader({ device }: DeviceDetailHeaderProps) {
  const cfg = STATUS_BADGES[device.status] || STATUS_BADGES.UNKNOWN;
  const hostname = (device.hostnames || [])[0] || "Unnamed device";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold leading-tight">{hostname}</h2>
        <p className="text-xs text-muted">{device.owner_email || "No owner assigned"}</p>
      </div>
      <Badge variant={cfg.variant}>{cfg.label}</Badge>
    </div>
  );
}

interface DeviceDetailProps {
  device: Device;
}

export function DeviceDetail({ device }: DeviceDetailProps) {
  const sources = device.sources || [];
  const hostnames = device.hostnames || [];
  const macs = device.mac_addresses || [];
  const sourceIds = device.source_ids || {};
  const sourceUrls = device.source_urls || {};
  const gaps = device.coverage_gaps || [];
  const isAiMatched = device.match_reason?.startsWith("ai_match");
  const confidence = device.confidence_score ?? 0;
  const confidenceColor =
    confidence >= 0.8 ? "text-emerald-400" : confidence >= 0.5 ? "text-amber-400" : "text-red-400";

  return (
    <div className="divide-y divide-border/60">
      <Section title="Identity">
        <dl>
          <Row label="Canonical ID" mono>{device.canonical_id}</Row>
          <Row label="Hostnames">
            {hostnames.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {hostnames.map((h) => (
                  <span key={h} className="rounded border border-border bg-card/60 px-1.5 py-0.5 text-xs">
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Row>
          <Row label="Serial number" mono>{device.serial_number || "—"}</Row>
          <Row label="MAC addresses">
            {macs.length > 0 ? (
              <div className="flex flex-wrap gap-1 font-mono text-xs">
                {macs.map((m) => (
                  <span key={m} className="rounded border border-border bg-card/60 px-1.5 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Row>
        </dl>
      </Section>

      <Section title="Owner">
        <dl>
          <Row label="Email">{device.owner_email || <span className="text-muted">—</span>}</Row>
          <Row label="Name">{device.owner_name || <span className="text-muted">—</span>}</Row>
        </dl>
      </Section>

      <Section title="Operating system">
        <dl>
          <Row label="OS">{device.os_type || "—"}</Row>
          <Row label="Days since seen">
            {device.days_since_seen !== null && device.days_since_seen !== undefined
              ? `${device.days_since_seen} day${device.days_since_seen === 1 ? "" : "s"}`
              : "—"}
          </Row>
          <Row label="Active VPN">{device.is_active_vpn ? "Yes" : "No"}</Row>
        </dl>
      </Section>

      <Section title="Location">
        <dl>
          <Row label="Region">{device.region || <span className="text-muted">—</span>}</Row>
          <Row label="Timezone" mono>{device.timezone || "—"}</Row>
        </dl>
      </Section>

      <Section title="Sources">
        {sources.length === 0 ? (
          <p className="text-sm text-muted">No sources reported this device.</p>
        ) : (
          <ul className="space-y-1.5">
            {sources.map((s) => {
              const id = sourceIds[s];
              const url = sourceUrls[s];
              return (
                <li
                  key={s}
                  className="grid grid-cols-[80px_1fr] items-center gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2 text-xs"
                >
                  <span className="font-medium uppercase" aria-label={SOURCE_NAMES[s] || s}>
                    {shortSource(s)}
                  </span>
                  {id && url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex min-w-0 items-center gap-1.5 font-mono text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                      title={`Open in ${SOURCE_NAMES[s] || s} console`}
                    >
                      <span className="truncate">{id}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="truncate font-mono text-muted">{id || "—"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Match">
        <dl>
          <Row label="Confidence">
            <span className={`font-semibold tabular-nums ${confidenceColor}`}>{confidence.toFixed(2)}</span>
          </Row>
          <Row label="Reason">
            <span className="inline-flex items-center gap-1 break-words">
              {isAiMatched && <Sparkles className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />}
              {device.match_reason || <span className="text-muted">—</span>}
            </span>
          </Row>
        </dl>
      </Section>

      {gaps.length > 0 && (
        <Section title="Coverage gaps">
          <ul className="flex flex-wrap gap-2">
            {gaps.map((g) => (
              <li
                key={g}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300"
              >
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                {GAP_LABELS[g] || g}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Timestamps">
        <dl>
          <Row label="First seen">{formatDate(device.first_seen)}</Row>
          <Row label="Last seen">{formatDate(device.last_seen)}</Row>
          {device.deleted_at && <Row label="Deleted at">{formatDate(device.deleted_at)}</Row>}
        </dl>
      </Section>

      {device.acknowledged && (
        <Section title="Acknowledgement">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Acknowledged
          </div>
          <dl>
            <Row label="Reason">{device.ack_reason || <span className="text-muted">—</span>}</Row>
            <Row label="By">{device.ack_by || <span className="text-muted">—</span>}</Row>
            <Row label="At">{formatDate(device.ack_at)}</Row>
          </dl>
        </Section>
      )}
    </div>
  );
}
