"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, ClipboardCopy, Plus } from "lucide-react";
import { DRINK_TYPES, type BasketInsights } from "@/lib/basket";
import type { BasketItem } from "@/lib/carreteState";
import { fmtCLP } from "./BudgetPanel";
import { useLocale } from "@/lib/useLocale";

interface Props {
  insights: BasketInsights;
  hours: number;
  items: BasketItem[];
  code: string;
  onAdd: (catalogId: string) => void;
}

function Meter({ label, have, need, unit, tone = "bg-emerald-400" }: { label: string; have: number; need: number; unit: string; tone?: string }) {
  const pct = need > 0 ? Math.min(100, (have / need) * 100) : 100;
  const ok = have >= need * 0.95;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className={`font-mono tabular ${ok ? "text-slate-300" : "text-amber-200"}`}>
          {have.toFixed(have < 10 ? 1 : 0)} / {need.toFixed(need < 10 ? 1 : 0)} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${ok ? tone : "bg-amber-400"} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** "¿Alcanza?": lectura humana del presupuesto, no solo total vs. monto. */
export default function BasketInsightsCard({ insights: x, hours, items, code, onAdd }: Props) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const [bankText, setBankText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tonight_saved_bank_details");
      if (raw) {
        const d = JSON.parse(raw) as Record<string, string>;
        if (Object.values(d).some(Boolean)) setBankText(locale.banking.copyTemplate({ ...d, amount: x.quota }));
      }
    } catch {
      /* sin datos */
    }
  }, [locale, x.quota]);

  const over = x.diff < 0;
  const headline = over
    ? `Faltan ${fmtCLP(-x.diff)}`
    : x.coverage === "corto"
    ? "Alcanza, pero queda corto"
    : x.coverage === "holgado"
    ? "Sobra copete"
    : "Alcanza justo";

  const vaca = [
    `🍻 *Vaca para el ${locale.terminology.partyName.toLowerCase()}*${code !== "SOLO" ? ` (sala ${code})` : ""}`,
    `Cada uno pone *${fmtCLP(x.quota)}*`,
    "",
    "Compramos:",
    ...items.map((i) => `• ${i.quantity}x ${i.name}`),
    bankText ? `\n${bankText}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(vaca);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  };

  return (
    <section className={`surface p-5 ${over ? "!border-rose-500/50" : ""}`} aria-live="polite" aria-labelledby="alcanza-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="eyebrow">¿Alcanza?</p>
          <h2 id="alcanza-title" className={`display mt-1 text-3xl ${over ? "text-rose-200" : ""}`}>
            {headline}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Canasta {fmtCLP(x.total)} de {fmtCLP(x.budget)}
            {!over && x.diff > 0 ? ` · sobran ${fmtCLP(x.diff)}` : ""}.
          </p>

          <div className="mt-5 flex items-end gap-6">
            <div>
              <p className="eyebrow !text-[10px]">Cada uno pone</p>
              <p className="font-display text-5xl font-extrabold leading-none text-white tabular">{fmtCLP(x.quota)}</p>
            </div>
            {x.drinkers > 0 && (
              <div className="pb-1 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-white">~{x.drinksPerDrinker.toFixed(1)} tragos</span> por persona que toma
                </p>
                <p className="text-xs text-slate-400">
                  Para {hours} h se recomiendan ~{x.recommendedPerDrinker.toFixed(1)} · alcanza para ~{Math.min(x.hoursCovered, 24).toFixed(1)} h
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={copy} className="btn-ghost text-xs">
              {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />} {copied ? "Copiado" : "Copiar la vaca"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(vaca)}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
              Pedir la vaca por WhatsApp
            </a>
          </div>
        </div>

        <div className="space-y-4">
          {x.drinkers > 0 && (
            <Meter label="Alcohol para la noche" have={x.drinksPerDrinker} need={x.recommendedPerDrinker} unit="tragos/pers." tone={x.coverage === "holgado" ? "bg-indigo-400" : "bg-emerald-400"} />
          )}
          <Meter label="Hielo" have={x.iceKg} need={x.iceNeededKg} unit="kg" tone="bg-cyan-300" />
          <Meter label="Agua" have={x.waterL} need={x.waterNeededL} unit="L" tone="bg-cyan-300" />
          {x.mixerNeededL > 0 && <Meter label="Mezcladores" have={x.mixerL} need={x.mixerNeededL} unit="L" />}

          {x.coverage === "holgado" && (
            <p className="text-xs text-slate-400">Compraron más de lo que se suele tomar en {hours} h. Puedes bajar cantidades y ahorrar.</p>
          )}

          {x.missingTypes.length > 0 && (
            <p className="flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-xs text-amber-100">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No alcanzó para {x.missingTypes.map((t) => DRINK_TYPES.find((d) => d.id === t)?.name.toLowerCase()).join(" ni ")}. Suban el monto o quítenlo de la lista.
            </p>
          )}

          {x.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-300">{over ? "Si consiguen un poco más:" : "Con lo que sobra, conviene sumar:"}</p>
              <ul className="mt-2 space-y-1.5">
                {x.suggestions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-slate-100">{s.name}</span>
                      <span className="block text-[11px] text-slate-400">{s.reason}</span>
                    </span>
                    <span className="font-mono text-xs tabular text-slate-300">{fmtCLP(s.price)}</span>
                    <button type="button" onClick={() => onAdd(s.id)} aria-label={`Agregar ${s.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-night-950">
                      <Plus className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
