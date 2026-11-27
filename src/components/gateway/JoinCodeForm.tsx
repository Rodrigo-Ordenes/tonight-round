"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";

/**
 * El código de la sala en seis casilleros (se puede pegar entero). Al abrirse deja el cursor en el primero. Lo usan la
 * portada y el apartado Sala.
 */
export default function JoinCodeForm({
  onJoin,
  onSolo,
  onClose,
  busy,
  error,
  clearError,
  autoFocus = true,
}: {
  onJoin: (code: string) => void;
  onSolo?: () => void;
  onClose?: () => void;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  autoFocus?: boolean;
}) {
  const [chars, setChars] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus({ preventScroll: true });
  }, [autoFocus]);

  const setChar = (i: number, v: string) => {
    const c = v.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    setChars((prev) => prev.map((x, idx) => (idx === i ? c : x)));
    clearError();
    if (c && i < chars.length - 1) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "Enter") onJoin(chars.join(""));
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!t) return;
    e.preventDefault();
    setChars([0, 1, 2, 3, 4, 5].map((i) => t[i] ?? ""));
    refs.current[Math.min(t.length, 5)]?.focus();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">¿Te invitaron? Ingresa el código</p>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white">
            Cerrar
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-[repeat(6,minmax(0,1fr))_3.5rem]" onPaste={onPaste}>
        {chars.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            onChange={(e) => setChar(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={2}
            aria-label={`Carácter ${i + 1} del código`}
            className="h-14 w-full min-w-0 rounded-xl border border-white/10 bg-night-950/70 text-center font-mono text-xl font-bold uppercase text-white outline-none transition-colors focus:border-indigo-400"
          />
        ))}
        <button
          type="button"
          onClick={() => onJoin(chars.join(""))}
          disabled={busy}
          aria-label="Entrar a la sala"
          className="col-span-6 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-night-950 transition-transform active:scale-95 disabled:opacity-60 sm:col-span-1 sm:h-14"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
        </button>
      </div>
      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {onSolo && (
        <button type="button" onClick={onSolo} className="mt-4 flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-slate-300 hover:text-white">
          Solo quiero planificar (sin sala) <ArrowUpRight className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
