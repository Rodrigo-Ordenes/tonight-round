"use client";

import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { DEFAULT_BRING } from "@/lib/carreteState";
import { audioEffects } from "@/lib/audioEffects";

const SUGGESTED = ["Hielo", "Agua", "Vasos", "Picoteo", "Parlante", "Hielera", "Limones", "Servilletas"];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** Lista "Yo llevo": cada invitado se adjudica algo desde su celular y todos ven quién trae qué. */
export default function BringList({ store, compact = false }: { store: CarreteStore; compact?: boolean }) {
  const { state, dispatch, participants, meId, isSolo } = store;
  const bring = state.bring ?? DEFAULT_BRING;
  const [text, setText] = useState("");
  const name = (id?: string) => participants.find((p) => p.id === id)?.name;
  const canClaim = !!meId && !isSolo;
  const missing = SUGGESTED.filter((l) => !bring.items.some((i) => i.id === slug(l)) && !bring.removed.includes(slug(l)));

  const add = (label: string) => {
    const clean = label.trim().slice(0, 40);
    if (!clean) return;
    audioEffects.playPop();
    dispatch({ type: "ADD_BRING", item: { id: slug(clean) || `item-${Date.now()}`, label: clean } });
  };

  const items = compact ? bring.items.slice(0, 6) : bring.items;
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
                    className="chip !min-h-[32px] disabled:opacity-40"
                  >
                    Yo lo llevo
                  </button>
                )}
                {!compact && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_BRING", id: i.id })}
                    aria-label={`Quitar ${i.label}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!compact && (
        <>
          {missing.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missing.map((l) => (
                <button key={l} type="button" onClick={() => add(l)} className="chip !min-h-[32px]">
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
