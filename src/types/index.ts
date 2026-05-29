export interface Device {
  canonical_id: string;
  hostnames: string[];
  serial_number: string | null;
  mac_addresses: string[];
  owner_email: string | null;
  owner_name: string | null;
  os_type: string | null;
  sources: string[];
  source_ids: Record<string, string>;
  status: string;
  confidence_score: number;
  match_reason: string;
  is_active_vpn: boolean;
  coverage_gaps: string[];
  days_since_seen: number | null;
  first_seen: string;
  last_seen: string;
  deleted_at: string | null;
  acknowledged?: boolean;
  ack_reason?: string;
  ack_by?: string;
  ack_at?: string;
  source_urls?: Record<string, string>;
  timezone?: string | null;
  region?: string | null;
}

export interface Summary {
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  by_region?: Record<string, number>;
  by_os?: Record<string, number>;
  endpoint_total?: number;
  total: number;
  risk_score: number;
  syncing?: boolean;
  next_sync?: string;
  sync_interval_hours?: number;
}

export interface SyncRun {
  id?: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_raw_devices: number;
  duplicates_removed: number;
  final_count: number;
  sources_ok: string[];
  sources_failed: string[];
}

export interface ApiDevicesResponse {
  devices: Device[];
}

export interface ApiSyncLastResponse {
  last_sync: SyncRun | null;
}

export interface StatusSnapshot {
  id: number;
  sync_run_id: number;
  recorded_at: string;
  total: number;
  fully_managed: number;
  managed: number;
  no_edr: number;
  no_mdm: number;
  idp_only: number;
  stale: number;
  unknown: number;
  server: number;
}

export interface TrendsResponse {
  trends: Record<string, number>;
  has_previous: boolean;
}

export interface Insight {
  priority: string;
  title: string;
  description: string;
}
