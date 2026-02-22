"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return { toasts, show };
}

export function ToastDialog({ toasts }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (toasts.length) {
      setOpen(true);
    } else {
      const timer = setTimeout(() => setOpen(false), 200);
      return () => clearTimeout(timer);
    }
  }, [toasts.length]);

  return (
    <dialog className="toast-dialog" open={open}>
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type} show`}>
            {toast.message}
          </div>
        ))}
      </div>
    </dialog>
  );
}