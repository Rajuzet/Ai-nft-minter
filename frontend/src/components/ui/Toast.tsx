"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, Info, Zap } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "tx";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  txHash?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  tx: (title: string, txHash: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ── Individual Toast Item ─────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />,
    error:   <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />,
    info:    <Info className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />,
    tx:      <Zap className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-emerald-500/30 bg-emerald-500/5",
    error:   "border-rose-500/30 bg-rose-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    info:    "border-cyan-500/30 bg-cyan-500/5",
    tx:      "border-indigo-500/30 bg-indigo-500/5",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border ${borders[toast.type]} bg-slate-900/90 backdrop-blur-xl px-4 py-3.5 shadow-2xl shadow-black/40 w-80 animate-slide-in`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.txHash && (
          <p className="text-[9px] font-mono text-indigo-400 mt-1 truncate">
            Tx: {toast.txHash}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-500 hover:text-white transition mt-0.5 flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // max 5 toasts
  }, []);

  const success = useCallback((title: string, message?: string) => addToast({ type: "success", title, message }), [addToast]);
  const error =   useCallback((title: string, message?: string) => addToast({ type: "error",   title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: "warning", title, message }), [addToast]);
  const info =    useCallback((title: string, message?: string) => addToast({ type: "info",    title, message }), [addToast]);
  const tx =      useCallback((title: string, txHash: string)  => addToast({ type: "tx",      title, txHash, duration: 8000 }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, tx }}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
