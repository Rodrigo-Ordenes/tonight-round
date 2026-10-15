"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DICTIONARY, SLANG, type DictionaryEntry } from "@/data/dictionary";
import { RECIPES, type Origin } from "@/data/drinks";

const FLAGS: Record<Origin, string> = { CL: "🇨🇱", MX: "🇲🇽", US: "🇺🇸", JP: "🇯🇵", INT: "🌍" };

/** Diccionario de tragos: qué es cada base, cómo se toma, en qué recetas aparece y la jerga del carrete. */
export default function Diccionario({ onPick }: { onPick: (recipeId: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(DICTIONARY[0].id);
  const [kind, setKind] = useState<DictionaryEntry["kind"] | "all">("all");

  const s = q.trim().toLowerCase();
  const entries = useMemo(
    () =>
      DICTIONARY.filter((e) => (kind === "all" || e.kind === kind) && (!s || `${e.name} ${e.origin} ${e.taste} ${e.howTo}`.toLowerCase().includes(s))),
    [s, kind]
  );
  const slang = useMemo(() => SLANG.filter((x) => !s || `${x.term} ${x.meaning}`.toLowerCase().includes(s)), [s]);

  return (
    <div className="space-y-10">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
        <span className="sr-only">Buscar en el diccionario</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un trago, un licor o una palabra (ej. mezcal, caña, kanpai)"
          className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-night-900/70 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
        />
      </label>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-2xl sm:text-3xl">Qué es cada cosa</h2>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Destilado", "Licor / aperitivo", "Fermentado", "Mezclador"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={`chip ${kind === k ? "chip-on" : ""}`}>
                {k === "all" ? "Todo" : k}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {entries.map((e) => {
            const isOpen = open === e.id;
            const recipes = e.ingredientId ? RECIPES.filter((r) => r.spec.some((l) => l.id === e.ingredientId)).slice(0, 6) : [];
            return (
              <li key={e.id} className={`surface overflow-hidden ${isOpen ? "md:col-span-2" : ""}`}>
                <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-4 text-left">
                  <span className="text-3xl">{e.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold text-white">{e.name}</span>
                      {e.countries?.map((c) => (
                        <span key={c} aria-label={c}>
                          {FLAGS[c]}
                        </span>
                      ))}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {e.kind} · {e.abv}
                    </span>
                  </span>
                  <span className="text-slate-500">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="grid gap-5 border-t border-white/[0.06] p-5 animate-fade-in md:grid-cols-2">
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="eyebrow !text-[10px]">De dónde viene</dt>
                        <dd className="mt-0.5 text-slate-200">{e.origin}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow !text-[10px]">A qué sabe</dt>
                        <dd className="mt-0.5 text-slate-200">{e.taste}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow !text-[10px]">Cómo se toma</dt>
                        <dd className="mt-0.5 text-slate-200">{e.howTo}</dd>
                      </div>
                    </dl>
                    <div className="space-y-4">
                      <p className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] p-3 text-sm text-indigo-50">💡 {e.fact}</p>
                      {recipes.length > 0 && (
                        <div>
                          <p className="eyebrow !text-[10px]">Prepáralo</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {recipes.map((r) => (
                              <button key={r.id} type="button" onClick={() => onPick(r.id)} className="chip">
                                {r.emoji} {r.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {entries.length === 0 && <p className="mt-4 text-sm text-slate-400">Nada con ese nombre en el diccionario.</p>}
      </section>

      <section>
        <h2 className="display text-2xl sm:text-3xl">Jerga del carrete</h2>
        <p className="mt-1 text-sm text-slate-400">Para entenderse en cualquier junta, de Santiago a Tokio.</p>
        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {slang.map((x) => (
            <div key={x.term} className="border-b border-white/[0.06] pb-3">
              <dt className="font-semibold text-white">
                {FLAGS[x.country]} {x.term}
              </dt>
              <dd className="text-sm text-slate-400">{x.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
