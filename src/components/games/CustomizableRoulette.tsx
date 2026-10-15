"use client";

import React, { useMemo, useState } from "react";
import { Dices, Users, PenLine, ListChecks, X } from "lucide-react";
import content from "@/data/games_content.json";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { CASTIGOS } from "@/data/party_prompts";

type Cat = { id: string; name: string; icon: string; phrases: string[] };
const EXTRA: Record<string, string[]> = { penitencias: CASTIGOS.suaves, desafios: CASTIGOS.retos };
const CATS: Cat[] = [
  ...content.roulette.categories.map((c) => ({ ...c, phrases: Array.from(new Set([...c.phrases, ...(EXTRA[c.id] ?? [])])) })),
  { id: "verdades", name: "Verdades", icon: "🗣️", phrases: CASTIGOS.verdades },
  { id: "sin_alcohol", name: "Sin alcohol", icon: "💧", phrases: CASTIGOS.sinAlcohol },
];
const COLORS = ["#FF5E36", "#9C82FF", "#FFBC20", "#86E64C", "#3EE0FF", "#FF6FA8", "#FA2D4A", "#C5FBA1"];

type Modal = null | "players" | "custom" | "bank";

export default function CustomizableRoulette({ store }: { store: CarreteStore }) {
  const { participants, updateParticipant, games, patchGames } = store;
  const [catId, setCatId] = useState(CATS[0].id);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ player: string; phrase: string } | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [draft, setDraft] = useState("");

  const players = participants.filter((p) => p.active);
  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const allPhrases = useMemo(
    () => [...cat.phrases, ...(games.rouletteCustom[cat.id] ?? [])],
    [cat, games.rouletteCustom]
  );
  const enabled = allPhrases.filter((p) => !games.rouletteDisabled.includes(p));

  const spin = () => {
    if (spinning || players.length === 0 || enabled.length === 0) return;
    audioEffects.playPop();
    setSpinning(true);
    setResult(null);
    const idx = Math.floor(Math.random() * players.length);
    const slice = 360 / players.length;
    // El puntero está arriba (0°). Llevar el centro del segmento idx a 0°.
    const target = 360 * 5 + (360 - (idx * slice + slice / 2));
    setRotation((r) => r - (r % 360) + target);
    setTimeout(() => {
      setSpinning(false);
      audioEffects.playSuccessChime();
      setResult({ player: players[idx].name, phrase: enabled[Math.floor(Math.random() * enabled.length)] });
    }, 4200);
  };

  const addPhrase = () => {
    const t = draft.trim();
    if (!t) return;
    patchGames({ rouletteCustom: { ...games.rouletteCustom, [cat.id]: [...(games.rouletteCustom[cat.id] ?? []), t] } });
    setDraft("");
    setModal(null);
  };

  const togglePhrase = (p: string) =>
    patchGames({
      rouletteDisabled: games.rouletteDisabled.includes(p)
        ? games.rouletteDisabled.filter((x) => x !== p)
        : [...games.rouletteDisabled, p],
    });

  const n = Math.max(players.length, 1);
  const slice = 360 / n;
  const polar = (deg: number) => {
    const r = ((deg - 90) * Math.PI) / 180;
    return [100 + 95 * Math.cos(r), 100 + 95 * Math.sin(r)];
  };

  return (
    <div className="rounded-3xl bg-night-900/80 border border-indigo-500/30 p-5 space-y-4">
      <div className="flex items-center justify-center gap-2 text-indigo-300 font-black">
        <Dices className="w-5 h-5" /> RULETA DEL CARRETE
      </div>

      {/* Categorías */}
      <div className="grid grid-cols-3 gap-2">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCatId(c.id);
              setResult(null);
            }}
            className={`min-h-[48px] rounded-xl text-[11px] font-bold px-1 ${
              catId === c.id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Rueda */}
      <div className="relative mx-auto w-64 h-64 max-w-full">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 text-2xl drop-shadow">🔻</div>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transform: `rotate(${rotation}deg)`, transition: "transform 4s cubic-bezier(0.17,0.67,0.12,1)" }}
        >
          {players.length === 0 ? (
            <circle cx="100" cy="100" r="95" fill="#1e293b" />
          ) : players.length === 1 ? (
            <circle cx="100" cy="100" r="95" fill={COLORS[0]} />
          ) : (
            players.map((p, i) => {
              const [x1, y1] = polar(i * slice);
              const [x2, y2] = polar((i + 1) * slice);
              const mid = polar(i * slice + slice / 2);
              const lx = 100 + 62 * ((mid[0] - 100) / 95);
              const ly = 100 + 62 * ((mid[1] - 100) / 95);
              return (
                <g key={p.id}>
                  <path
                    d={`M100,100 L${x1},${y1} A95,95 0 ${slice > 180 ? 1 : 0} 1 ${x2},${y2} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#0b1020"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lx}
                    y={ly}
                    fill="white"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${i * slice + slice / 2}, ${lx}, ${ly})`}
                  >
                    {p.name.slice(0, 9)}
                  </text>
                </g>
              );
            })
          )}
          <circle cx="100" cy="100" r="9" fill="#0b1020" stroke="#fff" strokeWidth="2" />
        </svg>
        {players.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate-400 px-10">
            Activa jugadores con «Editar Jugadores»
          </p>
        )}
      </div>

      <button
        onClick={spin}
        disabled={spinning || players.length === 0 || enabled.length === 0}
        className="w-full min-h-[56px] rounded-2xl bg-indigo-600 disabled:opacity-40 text-white font-black"
      >
        {spinning ? "Girando…" : "🎰 GIRAR RULETA"}
      </button>

      {result && (
        <div className="rounded-2xl border-2 border-pink-500/60 bg-pink-950/30 p-4 text-center">
          <p className="text-xs text-pink-300 font-bold uppercase">Le toca a</p>
          <p className="text-2xl font-black text-white">{result.player}</p>
          <p className="text-sm text-slate-200 mt-1">{result.phrase}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button onClick={() => setModal("players")} className="min-h-[48px] rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4" /> 👥 Editar Jugadores
        </button>
        <button onClick={() => setModal("custom")} className="min-h-[48px] rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5">
          <PenLine className="w-4 h-4" /> ✍️ Agregar Mi Propia Frase
        </button>
        <button onClick={() => setModal("bank")} className="min-h-[48px] rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5">
          <ListChecks className="w-4 h-4" /> 📋 Banco de Frases
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[80dvh] overflow-y-auto rounded-3xl bg-night-900 border border-indigo-500/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white">
                {modal === "players" ? "Editar jugadores" : modal === "custom" ? "Agregar mi propia frase" : `Banco de frases · ${cat.name}`}
              </h3>
              <button onClick={() => setModal(null)} aria-label="Cerrar" className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal === "players" &&
              (participants.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no hay participantes. Súmalos desde el Monstruómetro.</p>
              ) : (
                participants.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 min-h-[48px] px-3 rounded-xl bg-slate-800/70 text-sm text-white cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" checked={p.active} onChange={(e) => updateParticipant(p.id, { active: e.target.checked })} />
                    {p.name}
                  </label>
                ))
              ))}

            {modal === "custom" && (
              <>
                <p className="text-xs text-slate-400">Se agregará a «{cat.name}».</p>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Escribe tu penitencia, desafío o pregunta…"
                  className="w-full p-3 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                />
                <button onClick={addPhrase} className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-black text-sm">
                  Guardar frase
                </button>
              </>
            )}

            {modal === "bank" &&
              allPhrases.map((p) => (
                <label key={p} className="flex items-start gap-3 min-h-[48px] py-2 px-3 rounded-xl bg-slate-800/70 text-xs text-white cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 mt-0.5 shrink-0" checked={!games.rouletteDisabled.includes(p)} onChange={() => togglePhrase(p)} />
                  {p}
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
