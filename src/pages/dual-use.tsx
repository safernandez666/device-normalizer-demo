import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Monitor,
  Smartphone,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { shortSource } from "../lib/utils";

const PAGE_SIZE = 15;

interface DualDevice {
  hostname: string;
  status: string;
  sources?: string[];
  serial: string | null;
  os: string | null;
}

interface DualUser {
  email: string;
  corporate_devices: DualDevice[];
  personal_devices: DualDevice[];
}

interface AckModalProps {
  user: DualUser;
  onClose: () => void;
  onAck: (email: string, reason: string) => void;
}

function AckModal({ user, onClose, onAck }: AckModalProps) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Acknowledge Dual-Use</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-card"><X className="h-4 w-4 text-muted" /></button>
        </div>
        <p className="text-xs text-muted mb-1"><strong>{user.email}</strong></p>
        <p className="text-xs text-muted mb-4">
          This user's personal device will no longer appear in dual-use alerts and Slack notifications.
        </p>
        <label className="block text-xs font-medium text-muted mb-1">Reason</label>
        <Input
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Approved BYOD, personal phone for MFA only..."
          className="mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onAck(user.email, reason)}>Acknowledge</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DualUsePage() {
  const [data, setData] = useState<{ dual_use_count: number; total_users_with_devices: number; users: DualUser[] } | null>(null);
  const [ackedEmails, setAckedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAcked, setShowAcked] = useState(false);
  const [page, setPage] = useState(1);
  const [ackModal, setAckModal] = useState<DualUser | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dual-use");
      const json = await res.json();
      setData(json);
      // Load acked from localStorage
      const stored = localStorage.getItem("dual_use_acked");
      if (stored) setAckedEmails(new Set(JSON.parse(stored)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAck = useCallback((email: string, reason: string) => {
    const newAcked = new Set(ackedEmails);
    newAcked.add(email);
    setAckedEmails(newAcked);
    localStorage.setItem("dual_use_acked", JSON.stringify([...newAcked]));
    localStorage.setItem(`dual_use_ack_reason_${email}`, reason);
    setAckModal(null);
  }, [ackedEmails]);

  const handleUnack = useCallback((email: string) => {
    const newAcked = new Set(ackedEmails);
    newAcked.delete(email);
    setAckedEmails(newAcked);
    localStorage.setItem("dual_use_acked", JSON.stringify([...newAcked]));
    localStorage.removeItem(`dual_use_ack_reason_${email}`);
  }, [ackedEmails]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter((u) => {
      const isAcked = ackedEmails.has(u.email);
      if (!showAcked && isAcked) return false;
      if (q && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, showAcked, ackedEmails]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const unackedCount = data ? data.users.filter((u) => !ackedEmails.has(u.email)).length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <a href="/" className="rounded-lg p-2 hover:bg-card transition-colors"><ArrowLeft className="h-5 w-5" /></a>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dual-Use Devices</h1>
            <p className="text-xs text-muted">
              {data ? `${unackedCount} users with personal + corporate devices` : "Loading..."}
              {ackedEmails.size > 0 && ` — ${ackedEmails.size} acknowledged`}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{data.dual_use_count}</div>
              <div className="text-xs text-muted">Total Dual-Use</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{unackedCount}</div>
              <div className="text-xs text-muted">Unacknowledged</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{ackedEmails.size}</div>
              <div className="text-xs text-muted">Acknowledged</div>
            </CardContent></Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Search email</label>
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="user@example.com" />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input type="checkbox" checked={showAcked} onChange={(e) => { setShowAcked(e.target.checked); setPage(1); }}
                  className="rounded border-border" />
                Show acknowledged
              </label>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {loading && <Card><CardContent className="p-8 text-center text-muted">Loading...</CardContent></Card>}
          {!loading && pageItems.map((u) => {
            const isAcked = ackedEmails.has(u.email);
            return (
              <Card key={u.email} className={isAcked ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">{u.email}</div>
                      <div className="text-[10px] text-muted">{u.corporate_devices.length} corporate, {u.personal_devices.length} personal</div>
                    </div>
                    {isAcked ? (
                      <button onClick={() => handleUnack(u.email)}
                        className="rounded border border-border px-2 py-1 text-[10px] text-muted hover:bg-card transition-colors">Undo</button>
                    ) : (
                      <button onClick={() => setAckModal(u)}
                        className="rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-500 hover:bg-amber-500/10 transition-colors">Ack</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Corporate */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-500 mb-1.5">
                        <Monitor className="h-3 w-3" /> Corporate
                      </div>
                      {u.corporate_devices.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs mb-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="text-muted truncate">{d.hostname}</span>
                          <div className="flex gap-0.5">
                            {(d.sources || []).map((s) => (
                              <span key={s} className="rounded border border-border bg-card px-1 py-0.5 text-[8px] font-medium text-muted">{shortSource(s)}</span>
                            ))}
                          </div>
                          <Badge variant="success" className="text-[8px] px-1 py-0">{d.status}</Badge>
                        </div>
                      ))}
                    </div>
                    {/* Personal */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-500 mb-1.5">
                        <Smartphone className="h-3 w-3" /> Personal
                      </div>
                      {u.personal_devices.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs mb-1">
                          <ShieldOff className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-muted truncate">{d.hostname}</span>
                          <Badge variant="warning" className="text-[8px] px-1 py-0">IDP ONLY</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!loading && pageItems.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted">
              {data && data.dual_use_count === 0 ? "No dual-use users detected" : "No results"}
            </CardContent></Card>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted">{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {ackModal && <AckModal user={ackModal} onClose={() => setAckModal(null)} onAck={handleAck} />}
      </AnimatePresence>
    </div>
  );
}
