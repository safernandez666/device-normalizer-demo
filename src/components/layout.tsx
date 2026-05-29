import { useEffect, useState } from "react";
import { ShieldCheck, Clock } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { Summary, SyncRun } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  lastSync: SyncRun | null;
  summary?: Summary | null;
}

function Countdown({ nextSync }: { nextSync: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(nextSync).getTime() - Date.now();
      if (diff <= 0) { setRemaining("syncing soon..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [nextSync]);

  return (
    <span className="flex items-center gap-1 text-[11px] text-muted">
      <Clock className="h-3 w-3" />
      Next sync in {remaining}
    </span>
  );
}

export function Layout({ children, lastSync, summary }: LayoutProps) {
  const syncStatus = lastSync?.status === "success" ? "success" : "warning";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased transition-colors">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-sm">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Device Normalizer
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted">
                  Last sync: {lastSync ? formatDate(lastSync.finished_at || lastSync.started_at) : "N/A"}
                </p>
                {summary?.next_sync && <Countdown nextSync={summary.next_sync} />}
              </div>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              syncStatus === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }`}
          >
            {syncStatus === "success" ? "Healthy" : "Partial"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
