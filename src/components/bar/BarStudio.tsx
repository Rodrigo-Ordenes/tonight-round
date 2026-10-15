"use client";

import React, { useMemo, useState } from "react";
import { Check, ClipboardCopy, Minus, Plus, ShoppingCart, Sparkles, Trash2, X } from "lucide-react";
import {
  GLASS_LABEL,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  INGREDIENT_CATS,
  RECIPE_BY_ID,
  type Glass,
  type Method,
  type SpecLine,
} from "@/data/drinks";
import { analyzeGlass, bestNextBuys, fmtMl, matchPantry, missingFor, scaleSpec, servingsFor, type Scale } from "@/lib/bar";
import { audioEffects } from "@/lib/audioEffects";
import GlassVisual from "./GlassVisual";

export interface GlassDraft {
  /** Receta cargada, o null = mezcla libre */
  recipeId: string | null;
  /** Solo para mezcla libre */
  lines: SpecLine[];
  scale: Scale;
}

interface Props {
  pantry: Set<string>;
  togglePantry: (id: string) => void;
  setPantry: (ids: string[]) => void;
  shopping: string[];
  toggleShopping: (id: string) => void;
  clearShopping: () => void;
  draft: GlassDraft;
  setDraft: (d: GlassDraft) => void;
  /** Registrar el vaso servido en el Monstruómetro de la sala (si hay sala y "yo") */
  onLog?: (label: string, ml: number, abv: number) => void;
  logLabel?: string;
}

const QUICK = [
  { label: "Básicos de previa", ids: ["hielo", "limon", "bebida_cola", "sprite", "agua_gas", "tonica"] },
  { label: "Carrete chileno", ids: ["pisco", "bebida_cola", "hielo", "pipeno", "helado_pina", "vino_tinto", "cerveza", "limon"] },
  { label: "Peda mexicana", ids: ["tequila", "mezcal", "limon", "sal", "pomelo_soda", "cerveza", "salsas", "hielo"] },
  { label: "Izakaya", ids: ["whisky", "shochu", "umeshu", "sake", "agua_gas", "limon", "hielo", "cerveza"] },
];

const SCALES: { key: string; label: string; scale: Scale }[] = [
  { key: "vaso", label: "1 vaso", scale: { kind: "vaso" } },
  { key: "j15", label: "Jarra 1,5 L", scale: { kind: "jarra", liters: 1.5 } },
  { key: "j2", label: "Jarra 2 L", scale: { kind: "jarra", liters: 2 } },
];

const toneClass = {
  ok: "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-100",
  warn: "border-amber-400/40 bg-amber-400/[0.08] text-amber-100",
  danger: "border-rose-500/50 bg-rose-500/10 text-rose-100",
};

export default function BarStudio({
  pantry,
  togglePantry,
  setPantry,
  shopping,
  toggleShopping,
  clearShopping,
  draft,
  setDraft,
  onLog,
  logLabel,
}: Props) {
  const [cat, setCat] = useState(INGREDIENT_CATS[0].id);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);

  const match = useMemo(() => matchPantry(pantry), [pantry]);
  const nextBuys = useMemo(() => bestNextBuys(pantry), [pantry]);

  const recipe = draft.recipeId ? RECIPE_BY_ID.get(draft.recipeId) ?? null : null;
  const glass: Glass = recipe?.glass ?? "highball";
  const method: Method = recipe?.method ?? "directo";
  const servings = recipe ? servingsFor(recipe, draft.scale) : 1;
  const lines = recipe ? scaleSpec(recipe.spec, servings) : draft.lines;
  const analysis = analyzeGlass(lines, method, glass, servings);
  const missingInGlass = new Set((recipe ? missingFor(recipe, pantry) : lines.filter((l) => !pantry.has(l.id))).map((l) => l.id));

  const load = (id: string) => {
    audioEffects.playBubble();
    setLogged(false);
    setDraft({ ...draft, recipeId: id });
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      document.getElementById("vaso")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const freeMix = () => {
    audioEffects.playPop();
    setLogged(false);
    setDraft({ recipeId: null, lines: recipe ? recipe.spec.map((l) => ({ ...l })) : draft.lines, scale: { kind: "vaso" } });
  };

  const changeLine = (id: string, delta: number) => {
    const cur = draft.lines.find((l) => l.id === id);
    if (!cur) {
      if (delta > 0) {
        const ing = INGREDIENT_BY_ID.get(id);
        setDraft({ ...draft, lines: [...draft.lines, { id, ml: ing?.solid ? 0 : delta }] });
        audioEffects.playBubble();
      }
      return;
    }
    const ml = Math.max(0, cur.ml + delta);
    const solid = INGREDIENT_BY_ID.get(id)?.solid;
    setDraft({
      ...draft,
      lines: ml === 0 && !solid ? draft.lines.filter((l) => l.id !== id) : draft.lines.map((l) => (l.id === id ? { ...l, ml } : l)),
    });
  };

  const removeLine = (id: string) => setDraft({ ...draft, lines: draft.lines.filter((l) => l.id !== id) });

  const shoppingText = () =>
    `🛒 Falta para el bar:\n${shopping.map((id) => `• ${INGREDIENT_BY_ID.get(id)?.emoji ?? ""} ${INGREDIENT_BY_ID.get(id)?.name ?? id}`).join("\n")}`;

  const copyShopping = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  };

  const perServingMl = analysis.servedMl / Math.max(1, servings);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start">
      <div className="space-y-10 min-w-0">
        {/* ---------------- 1. Tu barra ---------------- */}
        <section aria-labelledby="barra-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Paso 1 · inventario</p>
              <h2 id="barra-title" className="display mt-1 text-2xl sm:text-3xl">
                Lo que hay en la mesa
              </h2>
              <p className="mt-1 text-sm text-slate-400">Marca lo que tienen. Esto no se sirve: solo sirve para saber qué pueden preparar.</p>
            </div>
            {pantry.size > 0 && (
              <button type="button" onClick={() => setPantry([])} className="text-xs font-semibold text-slate-400 hover:text-white">
                Vaciar ({pantry.size})
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  audioEffects.playPop();
                  setPantry(Array.from(new Set([...Array.from(pantry), ...q.ids])));
                }}
                className="chip"
              >
                <Plus className="w-3.5 h-3.5" /> {q.label}
              </button>
            ))}
          </div>

          <div className="mt-5 -mx-4 flex gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0" role="tablist" aria-label="Categorías de ingredientes">
            {INGREDIENT_CATS.map((c) => {
              const n = INGREDIENTS.filter((i) => i.cat === c.id && pantry.has(i.id)).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={cat === c.id}
                  onClick={() => setCat(c.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    cat === c.id ? "bg-white text-night-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {c.emoji} {c.label}
                  {n > 0 && <span className="ml-1.5 font-mono">{n}</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {INGREDIENTS.filter((i) => i.cat === cat).map((i) => {
              const on = pantry.has(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    audioEffects.playPop();
                    togglePantry(i.id);
                  }}
                  className={`flex min-h-[52px] items-center gap-2.5 rounded-2xl border px-3 text-left text-sm transition-all active:scale-[0.98] ${
                    on ? "border-emerald-400/60 bg-emerald-400/10 text-white" : "border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="text-lg">{i.emoji}</span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-semibold">{i.name}</span>
                    {i.abv > 0 && <span className="block font-mono text-[10px] text-slate-400">{Math.round(i.abv * 100)}°</span>}
                  </span>
                  {on && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------------- 2. Qué pueden preparar ---------------- */}
        <section aria-labelledby="pueden-title">
          <p className="eyebrow">Paso 2 · ideas</p>
          <h2 id="pueden-title" className="display mt-1 text-2xl sm:text-3xl">
            {pantry.size === 0 ? "Marca tu barra para ver ideas" : `Pueden preparar ${match.ready.length} ${match.ready.length === 1 ? "trago" : "tragos"}`}
          </h2>

          {match.ready.length > 0 && (
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2">
              {match.ready.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => load(r.id)}
                  className={`surface surface-hover flex items-center gap-3 p-3.5 text-left ${draft.recipeId === r.id ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-bold text-white">{r.name}</span>
                    <span className="block truncate text-xs text-slate-400">{r.family}</span>
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">Listo</span>
                </button>
              ))}
            </div>
          )}

          {match.almost.length > 0 && (
            <>
              <p className="mt-6 text-sm font-semibold text-slate-300">Te falta poco</p>
              <ul className="mt-2 space-y-2">
                {match.almost.slice(0, 8).map(({ recipe: r, missing }) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <button type="button" onClick={() => load(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="text-xl">{r.emoji}</span>
                      <span className="truncate font-semibold text-white">{r.name}</span>
                    </button>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">falta</span>
                      {missing.map((m) => {
                        const ing = INGREDIENT_BY_ID.get(m.id);
                        const inList = shopping.includes(m.id);
                        return (
                          <span key={m.id} className="inline-flex items-center overflow-hidden rounded-full border border-amber-400/40 text-[11px] font-semibold text-amber-100">
                            <span className="px-2.5 py-1">
                              {ing?.emoji} {ing?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePantry(m.id)}
                              className="border-l border-amber-400/30 px-2 py-1 hover:bg-amber-400/15"
                              title="Sí lo tenemos"
                            >
                              Tengo
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleShopping(m.id)}
                              className={`border-l border-amber-400/30 px-2 py-1 ${inList ? "bg-amber-400 text-night-950" : "hover:bg-amber-400/15"}`}
                              title="Agregar a la lista de compras"
                              aria-pressed={inList}
                            >
                              <ShoppingCart className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {nextBuys.length > 0 && pantry.size > 0 && (
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Sparkles className="w-4 h-4 text-indigo-300" /> Si compran una sola cosa más
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextBuys.map(({ id, unlocks }) => {
                  const ing = INGREDIENT_BY_ID.get(id);
                  const inList = shopping.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleShopping(id)} className={`chip ${inList ? "chip-on" : ""}`}>
                      {ing?.emoji} {ing?.name} · +{unlocks} {unlocks === 1 ? "trago" : "tragos"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {shopping.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-bold text-amber-100">
                  <ShoppingCart className="w-4 h-4" /> Lista de compras del bar ({shopping.length})
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={copyShopping} className="chip !min-h-[32px]">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />} {copied ? "Copiada" : "Copiar"}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shoppingText())}`} target="_blank" rel="noopener noreferrer" className="chip !min-h-[32px]">
                    WhatsApp
                  </a>
                  <button type="button" onClick={clearShopping} className="chip !min-h-[32px]" aria-label="Vaciar lista">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shopping.map((id) => (
                  <button key={id} type="button" onClick={() => toggleShopping(id)} className="chip !min-h-[30px] text-amber-100">
                    {INGREDIENT_BY_ID.get(id)?.emoji} {INGREDIENT_BY_ID.get(id)?.name} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ---------------- 3. El vaso ---------------- */}
      <aside id="vaso" aria-labelledby="vaso-title" className="surface scroll-mt-20 p-5 lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Paso 3 · en el vaso</p>
            <h2 id="vaso-title" className="display mt-1 truncate text-2xl">
              {recipe ? `${recipe.emoji} ${recipe.name}` : "Mezcla libre"}
            </h2>
            <p className="text-xs text-slate-400">
              {GLASS_LABEL[glass]}
              {recipe && servings > 1 ? ` · ${servings} porciones` : ""}
            </p>
          </div>
          <button type="button" onClick={freeMix} className="chip !min-h-[32px] shrink-0" title="Editar las medidas a mano">
            {recipe ? "Editar a mano" : "Libre"}
          </button>
        </div>

        {recipe && (
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.04] p-1" role="radiogroup" aria-label="Cantidad">
            {SCALES.map((s) => {
              const active = JSON.stringify(s.scale) === JSON.stringify(draft.scale);
              return (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    audioEffects.playPop();
                    setDraft({ ...draft, scale: s.scale });
                  }}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${active ? "bg-white text-night-950" : "text-slate-300 hover:text-white"}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-end gap-4">
          <GlassVisual lines={lines} glass={servings > 1 ? "jarro" : glass} missingIds={missingInGlass} className="h-56 w-36 shrink-0 drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]" />
          <dl className="grid flex-1 grid-cols-1 gap-3 pb-2">
            <div>
              <dt className="eyebrow !text-[10px]">Alcohol servido</dt>
              <dd className="font-display text-3xl font-extrabold text-white tabular">{analysis.abv.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="eyebrow !text-[10px]">Por porción</dt>
              <dd className="font-mono text-sm text-slate-200 tabular">
                {Math.round(perServingMl)} ml · {(analysis.grams / Math.max(1, servings)).toFixed(0)} g
              </dd>
            </div>
            <div>
              <dt className="eyebrow !text-[10px]">Equivale a</dt>
              <dd className="font-mono text-sm text-slate-200 tabular">{analysis.standardDrinks.toFixed(1)} tragos estándar</dd>
            </div>
            {analysis.iceCubes > 0 && (
              <div>
                <dt className="eyebrow !text-[10px]">Hielo</dt>
                <dd className="font-mono text-sm text-slate-200 tabular">
                  {analysis.iceCubes} cubos (~{((analysis.iceCubes * 25) / 1000).toFixed(analysis.iceCubes * 25 >= 1000 ? 1 : 2)} kg)
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Medidas */}
        <ul className="mt-5 space-y-1.5">
          {lines.map((l) => {
            const ing = INGREDIENT_BY_ID.get(l.id);
            const missing = missingInGlass.has(l.id);
            return (
              <li
                key={l.id}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
                  missing ? "border border-dashed border-amber-400/50 bg-amber-400/[0.05]" : "bg-white/[0.03]"
                }`}
              >
                <span className="h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ background: ing?.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-slate-100">
                    {ing?.name ?? l.id}
                    {l.optional && <span className="ml-1 text-[10px] text-slate-500">(opcional)</span>}
                  </span>
                  {missing && <span className="block text-[10px] font-semibold text-amber-300">No está en tu barra</span>}
                </span>
                {recipe ? (
                  <span className="shrink-0 font-mono text-xs text-slate-300 tabular">{l.ml > 0 ? fmtMl(l.ml) : l.label}</span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1">
                    {!ing?.solid && (
                      <>
                        <button type="button" onClick={() => changeLine(l.id, -10)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]" aria-label={`Menos ${ing?.name}`}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-14 text-center font-mono text-xs tabular">{l.ml} ml</span>
                        <button type="button" onClick={() => changeLine(l.id, 10)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]" aria-label={`Más ${ing?.name}`}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => removeLine(l.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white" aria-label={`Quitar ${ing?.name}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Mezcla libre: agregar desde la barra */}
        {!recipe && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-400">Agregar al vaso {pantry.size > 0 ? "desde tu barra" : ""}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(pantry.size > 0 ? INGREDIENTS.filter((i) => pantry.has(i.id)) : INGREDIENTS.slice(0, 14))
                .filter((i) => !draft.lines.some((l) => l.id === i.id))
                .map((i) => (
                  <button key={i.id} type="button" onClick={() => changeLine(i.id, i.cat === "destilado" ? 50 : i.cat === "licor" ? 20 : 100)} className="chip !min-h-[32px]">
                    {i.emoji} {i.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div role="status" className={`mt-5 rounded-2xl border p-3.5 text-sm ${toneClass[analysis.verdict.tone]}`}>
          <p className="font-bold">{analysis.verdict.title}</p>
          <p className="mt-0.5 text-xs opacity-90">{analysis.verdict.text}</p>
        </div>

        {recipe && (
          <ol className="mt-5 space-y-2">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="font-mono text-xs text-indigo-300">{String(i + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}

        {onLog && analysis.liquidMl > 0 && (
          <button
            type="button"
            onClick={() => {
              onLog(recipe?.name ?? "Mezcla libre", Math.round(perServingMl), analysis.abv / 100);
              audioEffects.playBubble();
              setLogged(true);
            }}
            className="btn-primary mt-5 w-full"
          >
            {logged ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {logged ? "Registrado" : logLabel ?? "Me lo tomé · registrar"}
          </button>
        )}
      </aside>
    </div>
  );
}
