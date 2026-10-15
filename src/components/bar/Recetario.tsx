"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FAMILIES, GLASS_LABEL, INGREDIENT_BY_ID, RECIPES, type Family, type Origin } from "@/data/drinks";
import { analyzeGlass, missingFor } from "@/lib/bar";

const ORIGINS: { id: Origin | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "CL", label: "🇨🇱 Chile" },
  { id: "MX", label: "🇲🇽 México" },
  { id: "US", label: "🇺🇸 EE.UU." },
  { id: "JP", label: "🇯🇵 Japón" },
  { id: "INT", label: "🌍 Mundo" },
];

/** Recetario completo: buscar, filtrar y mandar una receta al vaso. */
export default function Recetario({ pantry, onPick }: { pantry: Set<string>; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<Family | "all">("all");
  const [origin, setOrigin] = useState<Origin | "all">("all");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return RECIPES.filter((r) => (family === "all" || r.family === family) && (origin === "all" || r.origin === origin)).filter(
      (r) =>
        !s ||
        r.name.toLowerCase().includes(s) ||
        r.blurb.toLowerCase().includes(s) ||
        r.spec.some((l) => INGREDIENT_BY_ID.get(l.id)?.name.toLowerCase().includes(s))
    );
  }, [q, family, origin]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Buscar trago o ingrediente</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Busca entre ${RECIPES.length} tragos o por ingrediente (ej. "tequila")`}
            className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-night-900/70 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
          />
        </label>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
          {ORIGINS.map((o) => (
            <button key={o.id} type="button" onClick={() => setOrigin(o.id)} className={`chip shrink-0 ${origin === o.id ? "chip-on" : ""}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
          {(["all", ...FAMILIES] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFamily(f)} className={`chip shrink-0 ${family === f ? "chip-on" : ""}`}>
              {f === "all" ? "Todas las familias" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const a = analyzeGlass(r.spec, r.method, r.glass);
          const missing = pantry.size > 0 ? missingFor(r, pantry).length : null;
          return (
            <button key={r.id} type="button" onClick={() => onPick(r.id)} className="surface surface-hover flex flex-col p-5 text-left">
              <span className="flex items-start justify-between gap-2">
                <span className="text-3xl">{r.emoji}</span>
                <span className="flex flex-col items-end gap-1">
                  <span className="font-mono text-xs text-slate-300 tabular">{a.abv.toFixed(0)}%</span>
                  {missing !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${missing === 0 ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[0.06] text-slate-400"}`}>
                      {missing === 0 ? "Lo tienen" : `Faltan ${missing}`}
                    </span>
                  )}
                </span>
              </span>
              <span className="mt-4 font-display text-xl font-bold text-white">{r.name}</span>
              <span className="mt-1 text-sm leading-snug text-slate-300">{r.blurb}</span>
              <span className="mt-4 flex flex-wrap gap-1">
                {r.spec
                  .filter((l) => l.id !== "hielo")
                  .slice(0, 5)
                  .map((l) => (
                    <span key={l.id} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-300">
                      {INGREDIENT_BY_ID.get(l.id)?.name}
                    </span>
                  ))}
              </span>
              <span className="mt-auto pt-4 text-[11px] text-slate-500">
                {r.family} · {GLASS_LABEL[r.glass]}
              </span>
            </button>
          );
        })}
      </div>
      {list.length === 0 && <p className="text-sm text-slate-400">No encontramos tragos con ese filtro.</p>}
    </div>
  );
}
