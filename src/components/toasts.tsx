import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, CheckCircle2, Info, AlertOctagon } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
  duration?: number; // ms, 0 = manual dismiss
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertOctagon,
  info: Info,
};

const COLORS = {
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  error: "border-red-500/30 bg-red-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

const ICON_COLORS = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-red-500",
  info: "text-blue-500",
};

// Global toast state
let _addToast: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(t: Omit<Toast, "id">) {
  _addToast?.(t);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _addToast = (t) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { ...t, id }]);
    };
    // Expose globally for sidebar (which doesn't import toast directly)
    (window as any).__dn_toast = toast;
    return () => { _addToast = null; delete (window as any).__dn_toast; };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-80"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const dur = t.duration ?? 4000;
    if (dur > 0) {
      const timer = setTimeout(() => onDismiss(t.id), dur);
      return () => clearTimeout(timer);
    }
  }, [t, onDismiss]);

  const Icon = ICONS[t.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border ${COLORS[t.type]} p-3 shadow-lg backdrop-blur`}
    >
      <div className="flex gap-2.5">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${ICON_COLORS[t.type]}`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold">{t.title}</div>
          {t.message && <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{t.message}</div>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded p-0.5 transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
