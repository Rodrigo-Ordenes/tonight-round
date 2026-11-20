"use client";

import React from "react";
import { Clock, Play, Sparkles, Users } from "lucide-react";
import { PARTY_CATEGORIES, PARTY_GAMES, type PartyCategory } from "@/lib/partyGames";
import type { LiveGame } from "@/lib/carreteState";

/**
 * Juegos destacados: ocupan dos columnas en la vista «Todos». Son tres para que la grilla de cuatro columnas cierre
 * sin huecos (3 × 2 + 10 = 16 celdas).
 */
const BENTO_WIDE = new Set<LiveGame>(["proximidad", "cronometro", "infiltrado"]);

/**
 * Micro-escena SVG de cada Party Game: entra con el scroll y se anima al pasar o enfocar la tarjeta (en táctil, solo
 * las destacadas). Ámbar para el peligro (la bomba, la casilla maldita): la frambuesa queda para el conductor que tomó.
 */
function PartyMicroScene({ id, wide }: { id: LiveGame; wide: boolean }) {
  const sizeClass = wide ? "h-36 w-44 sm:h-40 sm:w-52" : "h-28 w-28";
  return (
    <div aria-hidden className={`scene-rise pointer-events-none absolute -right-2 -top-2 select-none ${sizeClass}`}>
      <div className="h-full w-full overflow-hidden opacity-90 transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105">
        {id === "proximidad" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <g className="bento-spin" style={{ transformOrigin: "122px 62px" }}>
              <circle cx="122" cy="62" r="46" stroke="#67AAFF" strokeWidth="1.8" strokeDasharray="8 6" opacity="0.55" />
              <circle cx="122" cy="62" r="30" stroke="#B93EF3" strokeWidth="1.6" opacity="0.6" />
              <path d="M122 16 V30 M122 94 V108 M76 62 H90 M154 62 H168" stroke="#89BDFF" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <circle cx="122" cy="62" r="10" fill="rgba(140,227,190,0.22)" stroke="#8CE3BE" strokeWidth="2" />
            <path d="M122 8 L127 20 H117 Z" fill="#8CE3BE" />
            <text x="122" y="66" textAnchor="middle" fill="#ECECF1" fontSize="10" fontFamily="monospace" fontWeight="800">74</text>
          </svg>
        )}
        {id === "cronometro" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <rect x="62" y="28" width="102" height="54" rx="14" stroke="#B93EF3" strokeWidth="1.8" fill="rgba(19,19,24,0.88)" />
            <text x="113" y="62" textAnchor="middle" fill="#D793FF" fontSize="22" fontFamily="monospace" fontWeight="800">07.5s</text>
            <circle cx="76" cy="40" r="4" fill="#E4B853" className="bento-pulse" />
            <path d="M142 28 C148 14 162 12 168 20" stroke="#E4B853" strokeWidth="2" strokeLinecap="round" />
            <circle cx="168" cy="20" r="4.5" fill="#E4B853" className="bento-pulse" />
          </svg>
        )}
        {id === "mayoria" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <rect x="48" y="56" width="14" height="44" rx="4" fill="rgba(103,170,255,0.3)" stroke="#67AAFF" strokeWidth="1.4" />
            <rect x="70" y="26" width="16" height="74" rx="4" fill="rgba(140,227,190,0.32)" stroke="#8CE3BE" strokeWidth="1.8" className="bento-float" />
            <rect x="94" y="68" width="14" height="32" rx="4" fill="rgba(185,62,243,0.28)" stroke="#B93EF3" strokeWidth="1.4" />
            <text x="78" y="20" textAnchor="middle" fill="#8CE3BE" fontSize="10" fontFamily="monospace" fontWeight="800">68%</text>
          </svg>
        )}
        {id === "cajas" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <g className="bento-float">
              <rect x="44" y="42" width="34" height="30" rx="6" stroke="#67AAFF" strokeWidth="1.6" fill="rgba(19,19,24,0.85)" />
              <path d="M44 54 H78 M61 42 V72" stroke="#67AAFF" strokeWidth="1.4" />
            </g>
            <g transform="translate(82 32) rotate(8 18 18)">
              <rect x="0" y="0" width="38" height="34" rx="7" stroke="#B93EF3" strokeWidth="1.8" fill="rgba(185,62,243,0.18)" />
              <text x="19" y="22" textAnchor="middle" fill="#ECECF1" fontSize="11" fontFamily="monospace" fontWeight="800">+30</text>
            </g>
          </svg>
        )}
        {id === "mentiroso" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <path d="M44 32 H118 C124 32 128 36 128 42 V72 C128 78 124 82 118 82 H74 L54 96 V82 H44 C38 82 34 78 34 72 V42 C34 36 38 32 44 32 Z" stroke="#B93EF3" strokeWidth="1.7" fill="rgba(19,19,24,0.86)" />
            <path d="M52 58 Q64 42 74 58 T96 58 T114 58" stroke="#8CE3BE" strokeWidth="2" strokeLinecap="round" className="bento-pulse" />
          </svg>
        )}
        {id === "dados" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <g className="bento-float">
              <g transform="translate(38 28) rotate(-12 22 22)">
                <rect x="0" y="0" width="42" height="42" rx="10" stroke="#67AAFF" strokeWidth="1.8" fill="rgba(19,19,24,0.9)" />
                <circle cx="13" cy="13" r="3" fill="#89BDFF" />
                <circle cx="29" cy="29" r="3" fill="#89BDFF" />
              </g>
            </g>
            <g transform="translate(76 42) rotate(14 22 22)">
              <rect x="0" y="0" width="44" height="44" rx="10" stroke="#8CE3BE" strokeWidth="1.8" fill="rgba(19,19,24,0.92)" />
              <circle cx="13" cy="13" r="3" fill="#8CE3BE" />
              <circle cx="31" cy="13" r="3" fill="#8CE3BE" />
              <circle cx="22" cy="22" r="3" fill="#D793FF" />
              <circle cx="13" cy="31" r="3" fill="#8CE3BE" />
              <circle cx="31" cy="31" r="3" fill="#8CE3BE" />
            </g>
          </svg>
        )}
        {id === "mayormenor" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <g transform="translate(46 22) rotate(-10 24 34)">
              <rect x="0" y="0" width="46" height="66" rx="8" stroke="#67AAFF" strokeWidth="1.6" fill="rgba(19,19,24,0.9)" />
              <text x="10" y="20" fill="#89BDFF" fontSize="12" fontFamily="monospace" fontWeight="800">7♠</text>
            </g>
            <g className="bento-float">
              <g transform="translate(76 26) rotate(10 24 34)">
                <rect x="0" y="0" width="46" height="66" rx="8" stroke="#B93EF3" strokeWidth="1.8" fill="rgba(19,19,24,0.95)" />
                <text x="10" y="20" fill="#D793FF" fontSize="12" fontFamily="monospace" fontWeight="800">Q♥</text>
                <path d="M23 34 L30 44 H16 Z" fill="#8CE3BE" />
              </g>
            </g>
          </svg>
        )}
        {id === "casilla" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <g transform="translate(76 18)">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => {
                const cx = (cell % 3) * 28;
                const cy = Math.floor(cell / 3) * 28;
                const cursed = cell === 4;
                return (
                  <rect
                    key={cell}
                    x={cx}
                    y={cy}
                    width="23"
                    height="23"
                    rx="6"
                    stroke={cursed ? "#E4B853" : "#67AAFF"}
                    strokeWidth={cursed ? "2" : "1.3"}
                    fill={cursed ? "rgba(228,184,83,0.22)" : "rgba(19,19,24,0.82)"}
                    className={cursed ? "bento-pulse" : undefined}
                  />
                );
              })}
            </g>
          </svg>
        )}
        {id === "probable" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <circle cx="88" cy="54" r="24" stroke="#67AAFF" strokeWidth="1.8" fill="rgba(103,170,255,0.14)" />
            <circle cx="88" cy="48" r="7" stroke="#8CE3BE" strokeWidth="1.6" />
            <path d="M74 68 C77 60 99 60 102 68" stroke="#8CE3BE" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M40 36 L62 46 M38 72 L62 62" stroke="#B93EF3" strokeWidth="2" strokeLinecap="round" className="bento-float" />
          </svg>
        )}
        {id === "infiltrado" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <circle cx="122" cy="58" r="38" stroke="#B93EF3" strokeWidth="1.6" strokeDasharray="5 5" opacity="0.55" />
            <g className="bento-float">
              <rect x="88" y="46" width="30" height="18" rx="6" stroke="#8CE3BE" strokeWidth="2" fill="rgba(19,19,24,0.92)" />
              <rect x="126" y="46" width="30" height="18" rx="6" stroke="#8CE3BE" strokeWidth="2" fill="rgba(19,19,24,0.92)" />
              <path d="M118 54 H126" stroke="#8CE3BE" strokeWidth="2" />
            </g>
            <text x="122" y="92" textAnchor="middle" fill="#D793FF" fontSize="11" fontFamily="monospace" fontWeight="800">??? · PISTA</text>
          </svg>
        )}
        {id === "porcentaje" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <path d="M48 78 A36 36 0 0 1 120 78" stroke="rgba(236,236,241,0.16)" strokeWidth="8" strokeLinecap="round" />
            <path d="M48 78 A36 36 0 0 1 108 52" stroke="#67AAFF" strokeWidth="8" strokeLinecap="round" className="bento-pulse" />
            <text x="84" y="76" textAnchor="middle" fill="#ECECF1" fontSize="15" fontFamily="monospace" fontWeight="800">72%</text>
          </svg>
        )}
        {id === "reflejos" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <circle cx="88" cy="56" r="30" stroke="#8CE3BE" strokeWidth="1.5" opacity="0.4" className="bento-pulse" />
            <path d="M92 24 L72 58 H88 L82 88 L106 52 H90 Z" fill="rgba(140,227,190,0.28)" stroke="#8CE3BE" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        )}
        {id === "ultimo" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <circle cx="62" cy="40" r="10" stroke="#67AAFF" strokeWidth="2" fill="rgba(103,170,255,0.2)" />
            <rect x="86" y="30" width="20" height="20" rx="5" stroke="#B93EF3" strokeWidth="2" fill="rgba(185,62,243,0.2)" className="bento-float" />
            <path d="M62 66 L73 86 H51 Z" stroke="#8CE3BE" strokeWidth="2" fill="rgba(140,227,190,0.2)" />
            <rect x="86" y="66" width="20" height="20" rx="10" stroke="#E4B853" strokeWidth="2" fill="rgba(228,184,83,0.2)" />
          </svg>
        )}
      </div>
    </div>
  );
}


/** Borde que se ilumina donde está el puntero (Magic UI «Magic Card»): solo con mouse o lápiz, y solo esa tarjeta */
function spotlight(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType === "touch") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${(e.clientX - r.left).toFixed(0)}px`);
  el.style.setProperty("--spot-y", `${(e.clientY - r.top).toFixed(0)}px`);
}

/**
 * Catálogo de Party Games en bento (Magic UI «Bento Grid»): los destacados ocupan dos columnas, cada tarjeta tiene su
 * micro-escena y, con puntero fino, un borde que se ilumina donde está el puntero. El juego en curso lleva un destello
 * que recorre su borde (Magic UI «Border Beam»). `onPlay` lanza la ronda en la sala; sin sala, el botón lleva a crearla
 * (`noRoom`).
 */
export default function PartyCatalog({ onPlay, playing, noRoom }: { onPlay?: (id: LiveGame) => void; playing?: LiveGame | null; noRoom?: React.ReactNode }) {
  const [cat, setCat] = React.useState<PartyCategory | "Todos">("Todos");
  const games = PARTY_GAMES.filter((g) => cat === "Todos" || g.category === cat);

  return (
    <section aria-labelledby="party-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Party Games</p>
          <h2 id="party-title" className="display text-2xl sm:text-3xl">
            Azar, predicción y faroles<span className="text-accent">.</span>
          </h2>
          <p className="meta mt-1">Cada uno elige en secreto desde su celular, la TV revela y suma puntos. Perder da un reto con alternativas, nunca obliga a tomar.</p>
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Categoría">
        {(["Todos", ...PARTY_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? "!border-indigo-300 !bg-indigo-500 !text-night-950" : ""}`}>
            {c}
          </button>
        ))}
      </div>

      <ul className="grid grid-flow-row-dense grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((g) => {
          const wide = cat === "Todos" && BENTO_WIDE.has(g.id);
          const live = playing === g.id;
          return (
            <li key={g.id} className={wide ? "sm:col-span-2" : ""}>
              <article
                onPointerMove={spotlight}
                data-featured={wide ? "" : undefined}
                className={`magic-card surface group relative flex h-full flex-col justify-between overflow-hidden p-5 ${live ? "ring-1 ring-indigo-400/60" : ""}`}
              >
                {live && <span aria-hidden className="border-beam" />}
                <PartyMicroScene id={g.id} wide={wide} />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-night-950/80 text-2xl" aria-hidden>
                      {g.emoji}
                    </span>
                    {wide && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-200">
                        <Sparkles className="h-3 w-3" aria-hidden /> Destacado
                      </span>
                    )}
                    {live && <span className="chip !min-h-0 !py-0.5 text-xs !text-emerald-200">En juego</span>}
                  </div>
                  <h3 className={`mt-3.5 font-display font-bold text-white ${wide ? "text-xl sm:text-2xl" : "text-lg"}`}>{g.name}</h3>
                  <p className={`mt-1.5 ${wide ? "max-w-md text-sm leading-relaxed text-slate-300" : "text-xs leading-snug text-slate-400"}`}>{g.blurb}</p>
                </div>

                <div className="relative z-10 mt-4 space-y-3">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 font-semibold text-indigo-200">{g.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden /> {g.minPlayers}+
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {g.duration}
                    </span>
                  </p>
                  {onPlay ? (
                    <button type="button" onClick={() => onPlay(g.id)} className="btn-primary w-full !min-h-[44px]">
                      <Play className="h-4 w-4" aria-hidden /> Jugar
                    </button>
                  ) : (
                    noRoom
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
