import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

const STYLES = {
  success: "border-emerald-500/40 text-emerald-300",
  error: "border-rose-500/40 text-rose-300",
  info: "border-accent-500/40 text-accent-400",
};
const ICONS = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((text, type = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass animate-slide-in rounded-xl border px-4 py-3 text-sm flex items-start gap-3 shadow-xl ${STYLES[t.type]}`}
          >
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full border border-current flex items-center justify-center text-xs font-bold">
              {ICONS[t.type]}
            </span>
            <span className="text-slate-100">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
