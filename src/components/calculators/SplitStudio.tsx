"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ClipboardCopy, Crown, Plus, Trash2, UserPlus } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { uid } from "@/store/useCarreteStore";
import type { ExpenseCategory, SplitMode } from "@/lib/carreteState";
import { DEFAULT_SPLIT } from "@/lib/carreteState";
import { ROUND_UNIT, computeSplit } from "@/lib/split";
import { useLocale } from "@/lib/useLocale";
import { audioEffects } from "@/lib/audioEffects";

const MODES: { id: SplitMode; label: string; desc: string }[] = [
  { id: "justo", label: "Justo", desc: "Lo común entre todos; el alcohol solo entre quienes toman." },
  { id: "consumo", label: "Por consumo", desc: "El alcohol según los gramos registrados en el Monstruómetro." },
  { id: "iguales", label: "Partes iguales", desc: "Todos pagan lo mismo, sin preguntas." },
];

/**
 * Cuentas del grupo: cada uno registra lo que pagó (botillería, pizzas, hielo…) desde su celular.
 * La división cruza el Monstruómetro (quién tomó y cuánto) y calcula las transferencias mínimas.
 */
export default function SplitStudio({ store }: { store: CarreteStore }) {
  const { locale, country, formatCurrency } = useLocale();
  const { participants, dispatch, meId, isSolo } = store;
  const split = store.state.split ?? DEFAULT_SPLIT;
  const unit = ROUND_UNIT[country] ?? 10;

  const [payer, setPayer] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<ExpenseCategory>("alcohol");
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);
  const [bankText, setBankText] = useState<string | null>(null);

  useEffect(() => {
    if (!payer && (meId || participants[0])) setPayer(meId ?? participants[0]?.id ?? "");
  }, [meId, participants, payer]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tonight_saved_bank_details");
      if (raw) {
        const d = JSON.parse(raw) as Record<string, string>;
        if (Object.values(d).some((v) => v)) setBankText(locale.banking.copyTemplate(d));
      }
    } catch {
      /* sin datos */
    }
  }, [locale]);

  const result = useMemo(() => computeSplit(participants, split.expenses, split.mode, split.soberIds, unit), [participants, split, unit]);
  const name = (id: string) => participants.find((p) => p.id === id)?.name ?? "¿?";

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount.replace(/[^\d.]/g, ""));
    if (!payer || !n || n <= 0) return;
    audioEffects.playSuccessChime();
    dispatch({
      type: "ADD_EXPENSE",
      expense: { id: uid(), payerId: payer, description: desc.trim() || (cat === "alcohol" ? "Alcohol" : "Canasta común"), amount: n, category: cat, at: Date.now() },
    });
    setDesc("");
    setAmount("");
  };

  const toggleSober = (id: string) => {
    const set = new Set(split.soberIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    dispatch({ type: "PATCH_SPLIT", patch: { soberIds: Array.from(set) } });
  };

  const drivers = participants.filter((p) => p.role === "driver");
  const meIsCreditor = result.transfers.some((t) => t.to === meId);

  const shareText = [
    `🧾 *Cuentas del ${locale.terminology.partyName.toLowerCase()}* · Tonight`,
    `Total: ${formatCurrency(result.total)} (alcohol ${formatCurrency(result.alcoholTotal)} · común ${formatCurrency(result.commonTotal)})`,
    `Modo: ${MODES.find((m) => m.id === result.effectiveMode)?.label}`,
    "",
    ...result.transfers.map((t) => `• ${name(t.from)} → ${name(t.to)}: *${formatCurrency(t.amount)}*`),
    drivers.length ? `\n👑 ${drivers.map((d) => d.name).join(" y ")} no paga alcohol: fue ${locale.terminology.driverTitle.toLowerCase()}. ¡Gracias!` : "",
    meIsCreditor && bankText ? `\n${bankText}` : "",
  ]
    .filter((x) => x !== "")
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
      <div className="min-w-0 space-y-10">
        {/* Quiénes */}
        <section>
          <p className="eyebrow">1 · Quiénes dividen</p>
          {participants.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Agrega a las personas (o únanse a la sala desde sus celulares).</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {participants.map((p) => {
                const sober = p.role === "driver" || split.soberIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => p.role !== "driver" && toggleSober(p.id)}
                    className={`chip !min-h-[42px] ${sober ? "border-amber-400/50 bg-amber-400/10 text-amber-100" : ""}`}
                    title={p.role === "driver" ? "Conductor designado: no paga alcohol" : "Tocar para marcar si no toma alcohol"}
                  >
                    {p.role === "driver" && <Crown className="w-3.5 h-3.5" />}
                    {p.name}
                    <span className="text-[10px] font-normal text-slate-400">{sober ? "sin alcohol" : "toma"}</span>
                  </button>
                );
              })}
            </div>
          )}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              store.addParticipant({ name: newName.trim() });
              setNewName("");
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Agregar persona"
              aria-label="Nombre de la persona"
              className="min-h-[44px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400 sm:max-w-xs"
            />
            <button type="submit" className="btn-ghost !min-h-[44px]">
              <UserPlus className="w-4 h-4" />
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-500">Toca un nombre para marcar a quien no toma alcohol. El conductor designado ya viene marcado.</p>
        </section>

        {/* Gastos */}
        <section>
          <p className="eyebrow">2 · Quién pagó qué</p>
          <form onSubmit={add} className="surface mt-3 grid gap-3 p-4 sm:grid-cols-[1fr_1fr]">
            <label className="text-xs font-semibold text-slate-400">
              Pagó
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="mt-1 min-h-[46px] w-full rounded-xl border border-white/10 bg-night-950 px-3 text-sm text-white outline-none focus:border-indigo-400"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.id === meId ? " (tú)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Monto ({locale.currency.code})
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                className="mt-1 min-h-[46px] w-full rounded-xl border border-white/10 bg-night-950 px-3 font-mono text-sm text-white outline-none focus:border-indigo-400"
              />
            </label>
            <label className="text-xs font-semibold text-slate-400 sm:col-span-2">
              En qué
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Botillería, pizzas, hielo…"
                className="mt-1 min-h-[46px] w-full rounded-xl border border-white/10 bg-night-950 px-3 text-sm text-white outline-none focus:border-indigo-400"
              />
            </label>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1 sm:col-span-1" role="radiogroup" aria-label="Tipo de gasto">
              {(
                [
                  { id: "alcohol", label: "🍾 Alcohol" },
                  { id: "comun", label: "🍕 Común" },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={cat === c.id}
                  onClick={() => setCat(c.id)}
                  className={`min-h-[40px] rounded-lg text-xs font-bold ${cat === c.id ? "bg-white text-night-950" : "text-slate-300"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={!participants.length} className="btn-primary">
              <Plus className="w-4 h-4" /> Agregar gasto
            </button>
          </form>

          {split.expenses.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {split.expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="text-lg">{e.category === "alcohol" ? "🍾" : "🍕"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white">{e.description}</span>
                    <span className="block text-xs text-slate-400">pagó {name(e.payerId)}</span>
                  </span>
                  <span className="font-mono tabular text-slate-100">{formatCurrency(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_EXPENSE", id: e.id })}
                    aria-label={`Borrar ${e.description}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isSolo && <p className="mt-2 text-xs text-slate-500">Cada celular de la sala puede sumar lo que pagó: se junta todo sin pisarse.</p>}
        </section>

        {/* Modo */}
        <section>
          <p className="eyebrow">3 · Cómo dividir</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => dispatch({ type: "PATCH_SPLIT", patch: { mode: m.id } })}
                aria-pressed={split.mode === m.id}
                className={`surface surface-hover p-4 text-left ${split.mode === m.id ? "ring-2 ring-indigo-400" : ""}`}
              >
                <span className="font-display text-base font-bold text-white">{m.label}</span>
                <span className="mt-1 block text-xs leading-snug text-slate-400">{m.desc}</span>
              </button>
            ))}
          </div>
          {split.mode === "consumo" && result.effectiveMode !== "consumo" && (
            <p className="mt-2 text-xs text-amber-200">Nadie registró tragos en el Monstruómetro todavía: usamos el modo Justo.</p>
          )}
        </section>
      </div>

      {/* Resultado */}
      <aside className="surface p-5 lg:sticky lg:top-6" aria-live="polite">
        <p className="eyebrow">Total</p>
        <p className="font-display text-5xl font-extrabold text-white tabular">{formatCurrency(result.total)}</p>
        <p className="mt-1 text-xs text-slate-400">
          Alcohol {formatCurrency(result.alcoholTotal)} · Común {formatCurrency(result.commonTotal)}
        </p>

        <ul className="mt-5 space-y-1.5">
          {result.people.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-slate-200">
                {p.name}
                {!p.drinks && <span className="ml-1 text-[10px] text-amber-300">sin alcohol</span>}
              </span>
              <span className="font-mono text-xs tabular text-slate-400">
                le toca <span className="text-slate-100">{formatCurrency(p.share)}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="eyebrow mt-6">Transferencias</p>
        {result.transfers.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">{result.total > 0 ? "¡Están a mano!" : "Agrega el primer gasto."}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {result.transfers.map((t, i) => (
              <li key={i} className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${t.from === meId || t.to === meId ? "bg-indigo-500/15" : "bg-white/[0.04]"}`}>
                <span className="truncate font-semibold text-white">{name(t.from)}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate font-semibold text-white">{name(t.to)}</span>
                <span className="ml-auto font-mono font-bold tabular text-emerald-300">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}

        {result.transfers.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={copy} className="btn-ghost text-xs">
              {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />} {copied ? "Copiado" : "Copiar"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
              WhatsApp
            </a>
          </div>
        )}
        {meIsCreditor && !bankText && (
          <p className="mt-3 text-[11px] text-slate-500">Tip: guarda tus datos de {locale.banking.systemName} en la pestaña «Una boleta» y se agregan al mensaje.</p>
        )}
      </aside>
    </div>
  );
}
