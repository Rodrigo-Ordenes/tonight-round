"use client";

import React, { useEffect, useRef, useState } from "react";
import { Clock, Minus, Plus, Users } from "lucide-react";

export const fmtCLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

const PER_PERSON = [3000, 5000, 8000, 12000, 20000];
const TOTAL = [15000, 30000, 50000, 80000, 120000];

interface Props {
  attendees: number;
  hours: number;
  budget: number;
  onChange: (p: { attendees?: number; hours?: number; budget?: number }) => void;
  /** País distinto de Chile: los precios del catálogo son de referencia en CLP */
  foreign?: boolean;
}

function Stepper({ label, value, unit, icon, onDec, onInc }: { label: string; value: number; unit: string; icon: React.ReactNode; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] p-3">
      <span className="flex items-center gap-2.5">
        <span className="text-slate-400">{icon}</span>
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
          <span className="font-display text-xl font-bold text-white tabular">
            {value} <span className="text-sm font-semibold text-slate-400">{unit}</span>
          </span>
        </span>
      </span>
      <span className="flex gap-1">
        <button type="button" onClick={onDec} aria-label={`Menos ${label}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white active:scale-95">
          <Minus className="w-4 h-4" />
        </button>
        <button type="button" onClick={onInc} aria-label={`Más ${label}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white active:scale-95">
          <Plus className="w-4 h-4" />
        </button>
      </span>
    </div>
  );
}

/**
 * Presupuesto pensado como lo piensa un grupo: "¿cuánto pone cada uno?".
 * Se puede escribir por persona o total, y la canasta se recalcula sola (sin botón "Aplicar").
 */
export default function BudgetPanel({ attendees, hours, budget, onChange, foreign }: Props) {
  const [mode, setMode] = useState<"persona" | "total">("persona");
  const shown = mode === "persona" ? Math.round(budget / Math.max(1, attendees)) : budget;
  const [text, setText] = useState(String(shown));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setText(String(shown));
  }, [shown]);

  const commit = (raw: string) => {
    const v = Number(raw.replace(/[^\d]/g, ""));
    editing.current = false;
    if (!v || v < 500) return;
    onChange({ budget: mode === "persona" ? v * attendees : v });
  };

  const onType = (raw: string) => {
    editing.current = true;
    setText(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(raw), 700);
  };

  const presets = mode === "persona" ? PER_PERSON : TOTAL;

  return (
    <section className="surface space-y-4 p-5" aria-labelledby="budget-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="budget-title" className="font-display text-lg font-bold text-white">
          ¿Cuántos son y cuánto ponen?
        </h2>
        <div className="flex rounded-xl bg-white/[0.04] p-1" role="radiogroup" aria-label="Forma del presupuesto">
          {(
            [
              { id: "persona", label: "Por persona" },
              { id: "total", label: "Total" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-bold ${mode === m.id ? "bg-white text-night-950" : "text-slate-300"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stepper
          label="Personas"
          value={attendees}
          unit=""
          icon={<Users className="w-4 h-4" />}
          onDec={() => onChange({ attendees: Math.max(2, attendees - 1), budget: mode === "persona" ? shown * Math.max(2, attendees - 1) : undefined })}
          onInc={() => onChange({ attendees: attendees + 1, budget: mode === "persona" ? shown * (attendees + 1) : undefined })}
        />
        <Stepper
          label="Duración"
          value={hours}
          unit="horas"
          icon={<Clock className="w-4 h-4" />}
          onDec={() => onChange({ hours: Math.max(1, hours - 1) })}
          onInc={() => onChange({ hours: Math.min(14, hours + 1) })}
        />
        <label className="flex flex-col justify-center rounded-2xl bg-white/[0.03] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {mode === "persona" ? "Cada uno pone" : "Presupuesto total"} {foreign ? "(CLP)" : ""}
          </span>
          <span className="mt-0.5 flex items-center gap-1">
            <span className="font-display text-xl font-bold text-slate-400">$</span>
            <input
              inputMode="numeric"
              value={text}
              onChange={(e) => onType(e.target.value)}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
              aria-label={mode === "persona" ? "Monto por persona" : "Presupuesto total"}
              className="w-full min-w-0 bg-transparent font-display text-xl font-bold text-white outline-none tabular"
            />
          </span>
          <span className="text-[11px] text-slate-500">
            {mode === "persona" ? `Total: ${fmtCLP(budget)}` : `${fmtCLP(budget / Math.max(1, attendees))} por persona`}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((v) => {
          const on = shown === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ budget: mode === "persona" ? v * attendees : v })}
              className={`chip ${on ? "chip-on" : ""}`}
            >
              {fmtCLP(v)}
              {mode === "persona" ? " c/u" : ""}
            </button>
          );
        })}
      </div>

      {foreign && (
        <p className="text-xs text-amber-200">
          Los precios del catálogo son de supermercados chilenos (CLP). Úsalos como referencia de cantidades y ajusta los montos a tu país.
        </p>
      )}
    </section>
  );
}
