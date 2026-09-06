import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 no-print">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm text-popover-foreground shadow-xl animate-in fade-in slide-in-from-bottom-2"
            >
              {t.kind === "error" ? (
                <AlertCircle size={16} className="text-destructive" />
              ) : (
                <CheckCircle2 size={16} className="text-primary" />
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
