"use client";

import React, { useState } from "react";
import { useDeferredDelete } from "@/lib/useDeferredDelete";
import UndoToast from "@/components/ui/UndoToast";
import { Check, Plus, X } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { DEFAULT_BRING } from "@/lib/carreteState";
import { audioEffects } from "@/lib/audioEffects";
import { bringSuggestions, newBringItem } from "@/lib/bring";

/** Lista "Yo llevo": cada invitado se adjudica algo desde su celular y todos ven quién trae qué. */
export default function BringList({ store, compact = false }: { store: CarreteStore; compact?: boolean }) {
  const { state, dispatch, participants, meId, isSolo } = store;
  const bring = state.bring ?? DEFAULT_BRING;
  const [text, setText] = useState("");
  const name = (id?: string) => participants.find((p) => p.id === id)?.name;
  const canClaim = !!meId && !isSolo;
  const missing = bringSuggestions(state.basket.items, bring);

  const add = (label: string) => {
    const item = newBringItem(label, bring);
    if (!item) return;
    audioEffects.playPop();
    dispatch({ type: "ADD_BRING", item });
  };

  const undoItem = useDeferredDelete((id) => dispatch({ type: "REMOVE_BRING", id }));
  const visible = bring.items.filter((i) => !undoItem.hidden.has(i.id));
  const items = compact ? visible.slice(0, 6) : visible;
  const pending = bring.items.filter((i) => !i.claimedBy).length;

  return (
    <section aria-labelledby="bring-title" className={compact ? "" : "surface p-5"}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="bring-title" className={compact ? "eyebrow" : "font-display text-xl font-bold text-white"}>
          Yo llevo
        </h2>
        {bring.items.length > 0 && <span className="text-xs text-slate-400">{pending === 0 ? "Todo cubierto" : `Faltan ${pending}`}</span>}
      </div>
      {!compact && <p className="meta mt-1">Que nadie llegue con la quinta bolsa de hielo: cada uno toca lo que trae.</p>}

      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((i) => {
            const mine = i.claimedBy === meId;
            return (
              <li key={i.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                <span className={`min-w-0 flex-1 truncate ${i.claimedBy ? "text-slate-300" : "text-white"}`}>{i.label}</span>
                {i.claimedBy ? (
                  <button
                    type="button"
                    disabled={!mine}
                    onClick={() => meId && dispatch({ type: "CLAIM_BRING", id: i.id, participantId: meId })}
                    className={`flex max-w-[50%] items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-semibold ${mine ? "bg-emerald-400/20 text-emerald-100" : "text-slate-400"}`}
                    title={mine ? "Tocar para soltarlo" : undefined}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{mine ? "Lo llevo yo" : name(i.claimedBy) ?? "Alguien"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => {
                      if (!meId) return;
                      audioEffects.playSuccessChime();
                      dispatch({ type: "CLAIM_BRING", id: i.id, participantId: meId });
                    }}
                    className="chip disabled:opacity-40"
                  >
                    Yo lo llevo
                  </button>
                )}
                {!compact && (
                  <button
                    type="button"
                    onClick={() => undoItem.remove(i.id)}
                    aria-label={`Quitar ${i.label}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {undoItem.last && <UndoToast text="Ítem quitado de la lista" onUndo={undoItem.undo} />}

      {!compact && (
        <>
          {missing.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missing.map((l) => (
                <button key={l} type="button" onClick={() => add(l)} className="chip">
                  <Plus className="w-3.5 h-3.5" /> {l}
                </button>
              ))}
            </div>
          )}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add(text);
              setText("");
            }}
          >
            <input
              value={text}
              maxLength={60}
              onChange={(e) => setText(e.target.value)}
              placeholder="Otra cosa (ej. carbón)"
              aria-label="Agregar algo a la lista"
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
            />
            <button type="submit" className="btn-ghost !min-h-[44px]" aria-label="Agregar">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          {!canClaim && <p className="mt-2 text-xs text-slate-500">{isSolo ? "En una sala, cada invitado se adjudica cosas desde su celular." : "Únete desde «Mi celular» para adjudicarte algo."}</p>}
        </>
      )}
    </section>
  );
}
