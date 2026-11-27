"use client";

import React from "react";
import { Clock, Play, Sparkles, Users } from "lucide-react";
import { PARTY_GAMES } from "@/lib/partyGames";
import type { LiveGame } from "@/lib/carreteState";
import { useRouter } from "next/navigation";

/**
 * Los imperdibles: seis juegos bien distintos (uno por tipo) para aprovechar los primeros segundos de atención. Dos
 * ocupan doble ancho: 2 × 2 + 4 = 8 celdas, la grilla de cuatro columnas cierra en dos filas sin huecos.
 */
/**
 * Dos apartados: Casino Night y Social Night. Cada uno abre con sus 3 imperdibles en grande (el casino: blackjack,
 * ruleta y la Frutillita; lo social: los tres clásicos de grupo) y debajo el resto de sus juegos.
 */
const NIGHTS: { id: string; title: string; desc: string; top: LiveGame[]; more: LiveGame[] }[] = [
  {
    id: "casino",
    title: "Casino Night",
    desc: "Mesas y máquinas de verdad, solo con puntos: nadie apuesta plata.",
    top: ["blackjack", "ruleta", "frutillita"],
    more: ["tragamonedas", "tragabar", "jackpot"],
  },
  {
    id: "social",
    title: "Social Night",
    desc: "Cada uno elige en secreto desde su celular y la TV revela.",
    top: ["probable", "infiltrado", "cronometro"],
    more: ["mentiroso", "mayoria", "proximidad", "porcentaje", "cajas", "dados", "casilla", "mayormenor", "reflejos", "ultimo"],
  },
];
const FEATURED_WIDE = new Set<LiveGame>(["blackjack", "ruleta", "frutillita"]);

/**
 * Micro-escena SVG de cada Party Game: entra con el scroll y se anima al pasar o enfocar la tarjeta (en táctil, solo
 * las destacadas). Ámbar para el peligro (la bomba, la casilla maldita): la frambuesa queda para el conductor que tomó.
 */
function PartyMicroScene({ id, wide }: { id: LiveGame; wide: boolean }) {
  const sizeClass = wide ? "h-36 w-44 sm:h-40 sm:w-52" : "h-28 w-28";
  return (
    <div aria-hidden className={`scene-rise pointer-events-none absolute -right-2 -top-2 select-none ${sizeClass}`}>
      <div className="h-full w-full overflow-hidden opacity-90 transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105">
        {id === "tragamonedas" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <rect x="70" y="18" width="98" height="96" rx="14" fill="rgba(19,19,24,0.92)" stroke="#67AAFF" strokeWidth="1.8" />
            <rect x="80" y="26" width="78" height="16" rx="6" fill="rgba(103,170,255,0.18)" stroke="#89BDFF" strokeWidth="1" />
            <text x="119" y="38" textAnchor="middle" fill="#ECECF1" fontSize="9" fontFamily="monospace" fontWeight="800">TONIGHT</text>
            {[0, 1, 2].map((k) => (
              <g key={k} className="bento-float" style={{ animationDelay: `${k * 0.2}s` }}>
                <rect x={80 + k * 27} y="50" width="22" height="34" rx="5" fill="#090A0D" stroke="rgba(236,236,241,0.25)" />
                <text x={91 + k * 27} y="73" textAnchor="middle" fill="#D793FF" fontSize="16" fontFamily="monospace" fontWeight="900">7</text>
              </g>
            ))}
            <path d="M168 50 L176 40" stroke="#8B8C96" strokeWidth="3" strokeLinecap="round" />
            <circle cx="177" cy="38" r="5" fill="#B93EF3" className="bento-pulse" />
          </svg>
        )}
        {id === "frutillita" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <rect x="34" y="22" width="96" height="76" rx="14" fill="rgba(19,19,24,0.92)" stroke="#E4B853" strokeWidth="1.6" />
            {["🍓", "🍓", "🍒"].map((f, k) => (
              <g key={k} className={k < 2 ? "bento-float" : undefined} style={{ animationDelay: `${k * 0.25}s` }}>
                <rect x={42 + k * 29} y="36" width="24" height="44" rx="6" fill="#090A0D" stroke="rgba(236,236,241,0.25)" />
                <text x={54 + k * 29} y="64" textAnchor="middle" fontSize="16">
                  {f}
                </text>
              </g>
            ))}
            <path d="M38 58 H126" stroke="#E4B853" strokeWidth="1" opacity="0.7" />
          </svg>
        )}
        {id === "tragabar" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            <rect x="40" y="24" width="88" height="70" rx="12" fill="rgba(19,19,24,0.92)" stroke="#B93EF3" strokeWidth="1.6" />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={48 + k * 26} y="36" width="20" height="46" rx="5" fill="#090A0D" stroke="rgba(236,236,241,0.25)" />
                <path d={`M${52 + k * 26} 46 L${64 + k * 26} 46 L${62 + k * 26} 74 L${54 + k * 26} 74 Z`} fill={k === 1 ? "rgba(214,238,247,0.55)" : "rgba(62,31,13,0.9)"} stroke="#89BDFF" strokeWidth="0.8" className={k === 1 ? "bento-pulse" : undefined} />
              </g>
            ))}
          </svg>
        )}
        {id === "jackpot" && (
          <svg viewBox="0 0 140 130" className="h-full w-full" fill="none">
            {[0, 1, 2].map((k) => (
              <rect key={k} x={36 + k * 32} y={k === 1 ? 30 : 42} width="26" height={k === 1 ? 56 : 44} rx="6" fill="rgba(19,19,24,0.92)" stroke={k === 1 ? "#E4B853" : "#67AAFF"} strokeWidth={k === 1 ? 2 : 1.4} />
            ))}
            <path d="M84 12 L92 20 L84 28 L76 20 Z" fill="rgba(228,184,83,0.35)" stroke="#E4B853" strokeWidth="1.4" className="bento-float" />
          </svg>
        )}
        {id === "ruleta" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <g className="bento-spin" style={{ transformOrigin: "124px 66px" }}>
              <circle cx="124" cy="66" r="50" fill="#2B1B12" stroke="#E4B853" strokeOpacity="0.5" />
              {Array.from({ length: 18 }, (_, k) => {
                const a = (k * 20 * Math.PI) / 180;
                const b = ((k * 20 + 20) * Math.PI) / 180;
                return <path key={k} d={`M124 66 L${(124 + Math.cos(a) * 44).toFixed(1)} ${(66 + Math.sin(a) * 44).toFixed(1)} A44 44 0 0 1 ${(124 + Math.cos(b) * 44).toFixed(1)} ${(66 + Math.sin(b) * 44).toFixed(1)} Z`} fill={k === 0 ? "#2D8162" : k % 2 ? "#981BCD" : "#0257AB"} />;
              })}
              <circle cx="124" cy="66" r="22" fill="#131318" stroke="#E4B853" strokeOpacity="0.4" />
              <circle cx="124" cy="66" r="6" fill="#89BDFF" />
            </g>
            <circle cx="124" cy="24" r="4" fill="#FFFFFF" />
          </svg>
        )}
        {id === "blackjack" && (
          <svg viewBox="0 0 180 150" className="h-full w-full" fill="none">
            <g transform="translate(86 28) rotate(-10 26 38)">
              <rect width="52" height="74" rx="8" fill="#F0F7FF" />
              <text x="9" y="22" fill="#090A0D" fontSize="16" fontWeight="900">A♠</text>
            </g>
            <g transform="translate(116 32) rotate(9 26 38)" className="bento-float">
              <rect width="52" height="74" rx="8" fill="#F0F7FF" />
              <text x="9" y="22" fill="#C9214B" fontSize="16" fontWeight="900">K♥</text>
            </g>
            <circle cx="98" cy="118" r="11" fill="#0257AB" stroke="#F0F7FF" strokeWidth="2" strokeDasharray="4 3" />
            <text x="98" y="122" textAnchor="middle" fill="#F0F7FF" fontSize="9" fontWeight="900">21</text>
          </svg>
        )}
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

/** Tarjeta de un juego: grande (bento, con micro-escena) o compacta (en las secciones que se deslizan) */
function GameCard({ g, wide, live, compact, onPlay, noRoom, onSolo }: { g: (typeof PARTY_GAMES)[number]; wide: boolean; live: boolean; compact?: boolean; onPlay?: (id: LiveGame) => void; noRoom?: React.ReactNode; onSolo?: (id: LiveGame) => void }) {
  // El casino también se juega en este computador, sin sala ni celulares
  const solo = g.category === "Casino" && onSolo ? (
    <button type="button" onClick={() => onSolo(g.id)} className="btn-ghost mt-2 w-full !min-h-[44px]">
      🎰 Jugar aquí
    </button>
  ) : null;
  if (compact)
    return (
      <article onPointerMove={spotlight} className={`magic-card surface group relative flex h-full flex-col justify-between p-4 ${live ? "ring-1 ring-indigo-400/60" : ""}`}>
        {live && <span aria-hidden className="border-beam" />}
        <div className="relative z-10">
          <span className="text-2xl" aria-hidden>
            {g.emoji}
          </span>
          <h3 className="mt-2 font-display text-base font-bold text-white">{g.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">{g.blurb}</p>
        </div>
        <div className="relative z-10 mt-3">
          {onPlay ? (
            <button type="button" onClick={() => onPlay(g.id)} className="btn-primary w-full !min-h-[44px]">
              <Play className="h-4 w-4" aria-hidden /> Jugar
            </button>
          ) : (
            noRoom
          )}
          {solo}
        </div>
      </article>
    );
  return (
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
        <h3 className={`relative z-10 mt-3.5 font-display font-bold text-white ${wide ? "pr-28 text-xl sm:pr-32 sm:text-2xl" : "text-lg"}`}>{g.name}</h3>
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
        {solo}
      </div>
    </article>
  );
}

/**
 * Catálogo de Party Games en bento (Magic UI «Bento Grid»): los destacados ocupan dos columnas, cada tarjeta tiene su
 * micro-escena y, con puntero fino, un borde que se ilumina donde está el puntero. El juego en curso lleva un destello
 * que recorre su borde (Magic UI «Border Beam»). `onPlay` lanza la ronda en la sala; sin sala, el botón lleva a crearla
 * (`noRoom`).
 */
export default function PartyCatalog({
  onPlay,
  playing,
  noRoom,
  only,
}: {
  onPlay?: (id: LiveGame) => void;
  playing?: LiveGame | null;
  noRoom?: React.ReactNode;
  /** El casino muestra solo sus mesas; los juegos de la sala, solo lo social */
  only?: "casino" | "social";
}) {
  // «Jugar aquí» lleva directo a la mesa del casino a pantalla completa (/casino/blackjack, /casino/ruleta…)
  const router = useRouter();
  const setSolo = (id: LiveGame) => router.push(`/casino/${id}`);
  // El casino va primero: es lo que más llama en la mesa (el orden relativo de cada grupo se mantiene)
  const byId = (id: LiveGame) => PARTY_GAMES.find((x) => x.id === id)!;

  return (
    <section aria-labelledby="party-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {only === "casino" ? (
          <div>
            <p className="eyebrow !text-[#ECC85F]">Casino Night</p>
            <h2 id="party-title" className="display casino-title text-2xl sm:text-3xl">
              Las mesas de la casa.
            </h2>
            <p className="meta mt-1 !text-[#F5F0E6]/75">Mesas y máquinas de verdad, solo con puntos: nadie apuesta plata. Juega aquí mismo o, con sala, en la TV con los celulares.</p>
          </div>
        ) : (
          <div>
            <p className="eyebrow">Party Games</p>
            <h2 id="party-title" className="display text-2xl sm:text-3xl">
              Azar, predicción y faroles<span className="text-accent">.</span>
            </h2>
            <p className="meta mt-1">Cada uno elige en secreto desde su celular, la TV revela y suma puntos. Perder da un reto con alternativas, nunca obliga a tomar.</p>
          </div>
        )}
      </div>

      {NIGHTS.filter((night) => !only || night.id === only).map((night) => (
        <section key={night.id} aria-label={night.title} className="space-y-3.5">
          <div>
            <h3 className="display text-2xl text-white sm:text-3xl">
              {night.title}
              <span className="text-accent">.</span>
            </h3>
            <p className="text-sm text-slate-400">{night.desc}</p>
          </div>
          {/* Los 3 imperdibles de la noche, en grande */}
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3" aria-label={`Los imperdibles de ${night.title}`}>
            {night.top.map(byId).map((g) => (
              <li key={g.id}>
                <GameCard onSolo={setSolo} g={g} wide={FEATURED_WIDE.has(g.id)} live={playing === g.id} onPlay={onPlay} noRoom={noRoom} />
              </li>
            ))}
          </ul>
          {/* El resto, en una fila que se desliza de lado */}
          <ul className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1" aria-label={`Más de ${night.title}`}>
            {night.more.map(byId).map((g) => (
              <li key={g.id} className="w-[15.5rem] shrink-0 snap-start">
                <GameCard onSolo={setSolo} g={g} wide={false} compact live={playing === g.id} onPlay={onPlay} noRoom={noRoom} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
