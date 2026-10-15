"use client";

import React, { useId } from "react";
import { INGREDIENT_BY_ID, type Glass, type SpecLine } from "@/data/drinks";

type Shape = "tall" | "short" | "coupe" | "wine" | "mug";

const SHAPE: Record<Glass, Shape> = {
  highball: "tall",
  jarro: "tall",
  schop: "tall",
  rocks: "short",
  shot: "short",
  copa: "coupe",
  flauta: "coupe",
  copa_vino: "wine",
  mug: "mug",
};

// Interior del vaso (zona donde va el líquido): x0..x1 en la base y en el borde, yTop..yBottom
const GEOM: Record<Shape, { outline: string; clip: string; top: number; bottom: number }> = {
  tall: { outline: "M34 18 L126 18 L118 232 Q118 240 110 240 L50 240 Q42 240 42 232 Z", clip: "M36 20 L124 20 L116 230 L44 230 Z", top: 24, bottom: 230 },
  short: { outline: "M26 96 L134 96 L126 232 Q126 240 118 240 L42 240 Q34 240 34 232 Z", clip: "M28 98 L132 98 L124 230 L36 230 Z", top: 102, bottom: 230 },
  coupe: { outline: "M20 40 L140 40 L84 128 L84 222 L114 230 L46 230 L76 222 L76 128 Z", clip: "M24 42 L136 42 L82 126 L78 126 Z", top: 44, bottom: 126 },
  wine: { outline: "M36 24 Q30 110 72 132 L76 134 L76 222 L112 232 L48 232 L84 222 L84 134 L88 132 Q130 110 124 24 Z", clip: "M38 26 L122 26 Q126 106 86 128 L74 128 Q34 106 38 26 Z", top: 30, bottom: 128 },
  mug: { outline: "M28 40 L122 40 L122 232 Q122 240 114 240 L36 240 Q28 240 28 232 Z M122 80 Q152 80 152 120 Q152 170 122 170", clip: "M30 42 L120 42 L120 230 L30 230 Z", top: 46, bottom: 230 },
};

interface Props {
  lines: SpecLine[];
  glass: Glass;
  /** Ingredientes del vaso que no están en la barra: se dibujan punteados */
  missingIds?: Set<string>;
  className?: string;
}

/** Vaso SVG por capas: cada ingrediente líquido es una franja proporcional a sus ml, en orden de servido. */
export default function GlassVisual({ lines, glass, missingIds, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const shape = SHAPE[glass];
  const g = GEOM[shape];
  const liquids = lines.filter((l) => l.ml > 0 && !INGREDIENT_BY_ID.get(l.id)?.solid);
  const total = liquids.reduce((a, l) => a + l.ml, 0);
  const hasIce = lines.some((l) => l.id === "hielo");
  const fizzy = liquids.some((l) => ["agua_gas", "tonica", "sprite", "bebida_cola", "ginger_ale", "ginger_beer", "espumante", "cerveza", "pomelo_soda", "energetica", "fanta"].includes(l.id));
  const garnish = lines.filter((l) => INGREDIENT_BY_ID.get(l.id)?.solid && l.id !== "hielo");

  const fillHeight = (g.bottom - g.top) * (total > 0 ? 0.9 : 0);
  let y = g.bottom;
  const layers = liquids.map((l) => {
    const h = (l.ml / total) * fillHeight;
    y -= h;
    return { l, y, h, color: INGREDIENT_BY_ID.get(l.id)?.color ?? "#888" };
  });
  const surface = g.bottom - fillHeight;

  return (
    <svg viewBox="0 0 160 250" className={className} role="img" aria-label={`Vaso con ${liquids.map((l) => INGREDIENT_BY_ID.get(l.id)?.name).join(", ") || "nada"}`}>
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={g.clip} />
        </clipPath>
        <linearGradient id={`shine-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
        </linearGradient>
        <pattern id={`missing-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="transparent" />
          <rect width="3" height="8" fill="#FFBC20" fillOpacity="0.55" />
        </pattern>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        {layers.map(({ l, y: ly, h, color }) => (
          <g key={`${l.id}-${ly}`}>
            <rect x="0" y={ly} width="160" height={h + 0.5} fill={color} className="transition-all duration-700 ease-out" />
            {missingIds?.has(l.id) && <rect x="0" y={ly} width="160" height={h + 0.5} fill={`url(#missing-${uid})`} />}
          </g>
        ))}
        {total > 0 && (
          // Superficie con oleaje
          <g className="animate-liquid-wave" style={{ transformBox: "fill-box" }}>
            <path
              d={`M0 ${surface} q10 -4 20 0 ${"t20 0 ".repeat(15)}V${surface + 6} H0 Z`}
              fill="#fff"
              fillOpacity="0.18"
            />
          </g>
        )}
        {hasIce &&
          total > 0 &&
          [0, 1, 2].map((i) => (
            <rect
              key={i}
              x={52 + i * 22 - (i === 1 ? 4 : 0)}
              y={surface + 6 + (i % 2) * 22}
              width="22"
              height="22"
              rx="5"
              fill="#fff"
              fillOpacity="0.28"
              stroke="#fff"
              strokeOpacity="0.5"
              transform={`rotate(${i * 17 - 12} ${63 + i * 22} ${surface + 17 + (i % 2) * 22})`}
            />
          ))}
        {fizzy &&
          total > 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={50 + ((i * 37) % 60)}
              cy={g.bottom - 6}
              r={1.4 + (i % 3) * 0.6}
              fill="#fff"
              fillOpacity="0.7"
              className="animate-canister-bubble"
              style={{ animationDelay: `${i * 0.35}s`, transformBox: "fill-box" }}
            />
          ))}
      </g>

      <path d={g.outline} fill={`url(#shine-${uid})`} stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinejoin="round" />

      {garnish.slice(0, 2).map((l, i) => (
        <text key={l.id} x={shape === "coupe" ? 118 - i * 20 : 120 - i * 22} y={g.top + 4} fontSize="20" textAnchor="middle">
          {INGREDIENT_BY_ID.get(l.id)?.emoji}
        </text>
      ))}
    </svg>
  );
}
