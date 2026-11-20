"use client";

import React, { useId } from "react";
import { INGREDIENT_BY_ID, type Glass, type SpecLine } from "@/data/drinks";
import { darken, drinkLook, lighten, mix } from "@/lib/drinkLook";

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

/** Interpolación lineal de la pared: x en `y` entre (y0, x0) y (y1, x1) */
const wall = (y: number, y0: number, x0: number, y1: number, x1: number) => x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);

interface Geo {
  outline: string;
  /** Interior donde va el líquido */
  clip: string;
  top: number;
  bottom: number;
  /** Borde de arriba: altura y extremos */
  rim: { y: number; x0: number; x1: number };
  /** Ancho del interior a cada altura (para la superficie y lo que flota) */
  inner: (y: number) => [number, number];
  /** Base gruesa o pie de la copa */
  foot: { y: number; rx: number };
  /** Reflejo vertical sobre la pared izquierda */
  streak: string;
}

const GEOM: Record<Shape, Geo> = {
  tall: {
    outline: "M34 18 L126 18 L118 232 Q118 240 110 240 L50 240 Q42 240 42 232 Z",
    clip: "M36 20 L124 20 L116 230 L44 230 Z",
    top: 24,
    bottom: 230,
    rim: { y: 18, x0: 34, x1: 126 },
    inner: (y) => [wall(y, 20, 36, 230, 44), wall(y, 20, 124, 230, 116)],
    foot: { y: 234, rx: 34 },
    streak: "M42 30 L48 222",
  },
  short: {
    outline: "M26 96 L134 96 L126 232 Q126 240 118 240 L42 240 Q34 240 34 232 Z",
    clip: "M28 98 L132 98 L124 230 L36 230 Z",
    top: 102,
    bottom: 230,
    rim: { y: 96, x0: 26, x1: 134 },
    inner: (y) => [wall(y, 98, 28, 230, 36), wall(y, 98, 132, 230, 124)],
    foot: { y: 234, rx: 42 },
    streak: "M34 106 L40 224",
  },
  coupe: {
    outline: "M20 40 L140 40 L84 128 L84 222 L114 230 L46 230 L76 222 L76 128 Z",
    clip: "M24 42 L136 42 L82 126 L78 126 Z",
    top: 44,
    bottom: 126,
    rim: { y: 40, x0: 20, x1: 140 },
    inner: (y) => [wall(y, 42, 24, 126, 78), wall(y, 42, 136, 126, 82)],
    foot: { y: 228, rx: 34 },
    streak: "M32 48 L70 108",
  },
  wine: {
    outline: "M36 24 Q30 110 72 132 L76 134 L76 222 L112 232 L48 232 L84 222 L84 134 L88 132 Q130 110 124 24 Z",
    clip: "M38 26 L122 26 Q126 106 86 128 L74 128 Q34 106 38 26 Z",
    top: 30,
    bottom: 128,
    rim: { y: 24, x0: 36, x1: 124 },
    inner: (y) => {
      const t = Math.min(1, Math.max(0, (y - 26) / 102));
      const half = 6 + 36 * (1 - Math.pow(t, 2.2));
      return [80 - half, 80 + half];
    },
    foot: { y: 230, rx: 32 },
    streak: "M44 34 Q42 84 62 110",
  },
  mug: {
    outline: "M28 40 L122 40 L122 232 Q122 240 114 240 L36 240 Q28 240 28 232 Z M122 80 Q152 80 152 120 Q152 170 122 170",
    clip: "M30 42 L120 42 L120 230 L30 230 Z",
    top: 46,
    bottom: 230,
    rim: { y: 40, x0: 28, x1: 122 },
    inner: () => [30, 120],
    foot: { y: 234, rx: 42 },
    streak: "M36 52 L36 222",
  },
};

/** Azar estable (las gotas y burbujas no saltan de lugar al cambiar la receta) */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lo que no es líquido de la mezcla: la espuma, el helado y las gotas se dibujan aparte */
const APART = new Set(["clara_huevo", "helado_pina", "angostura"]);

interface Props {
  lines: SpecLine[];
  glass: Glass;
  /** Ingredientes del vaso que no están en la barra: se dibujan con trama */
  missingIds?: Set<string>;
  className?: string;
}

/**
 * Vaso de lado, lo más real posible en SVG. Cada líquido sigue siendo una franja proporcional a sus ml (en orden de
 * servido, con el borde difuso de un trago recién servido; la granadina se va al fondo), dentro de un vaso con volumen:
 * sombreado de cilindro, superficie en perspectiva, borde y base gruesos, hielo con volumen, burbujas, espuma con gotas
 * de amargo, helado, guarniciones dibujadas, bombilla quebrada por la refracción y el vidrio empañado si lleva hielo.
 * Debajo, su sombra y la luz de color que el trago proyecta en la mesa.
 */
export default function GlassVisual({ lines, glass, missingIds, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const shape = SHAPE[glass];
  const g = GEOM[shape];
  const look = drinkLook(lines, glass);
  const liquids = lines.filter((l) => l.ml > 0 && !INGREDIENT_BY_ID.get(l.id)?.solid && !APART.has(l.id));
  // La granadina no se mezcla sola: baja al fondo
  if (look.sinks) liquids.sort((a, b) => Number(b.id === "granadina") - Number(a.id === "granadina"));
  const total = liquids.reduce((a, l) => a + l.ml, 0);
  const full = total > 0;
  const colorOf = (id: string) => INGREDIENT_BY_ID.get(id)?.color ?? "#888888";
  const ref = (name: string) => `url(#${name}-${uid})`;
  const id = (name: string) => `${name}-${uid}`;
  const rand = seeded(lines.length * 97 + shape.length * 13 + Math.round(total));
  const pour = `${glass}|${lines.map((l) => l.id).join(",")}`;
  const pourStyle = { transformOrigin: `0px ${g.bottom}px`, transformBox: "view-box" } as React.CSSProperties;

  const span = g.bottom - g.top;
  const surface = full ? g.bottom - span * 0.9 : g.bottom;
  const foamH = look.foam === "cerveza" ? 18 : look.foam === "clara" ? 11 : 0;
  const liquidTop = surface + (full ? foamH : 0);

  // Franjas de abajo hacia arriba en orden de servido
  let y = g.bottom;
  const bands = liquids.map((l) => {
    const h = (l.ml / total) * (g.bottom - liquidTop);
    y -= h;
    return { l, y0: y, y1: y + h, color: colorOf(l.id) };
  });
  // Degradado vertical con bordes difusos entre franjas (más largo para la granadina que se asienta)
  const stops: { at: number; color: string }[] = [];
  for (const b of [...bands].reverse()) {
    const feather = Math.min(b.l.id === "granadina" ? 14 : 8, (b.y1 - b.y0) / 2);
    stops.push({ at: b.y0 + feather, color: b.color }, { at: b.y1 - feather, color: b.color });
  }
  const off = (v: number) => Math.min(1, Math.max(0, (v - liquidTop) / Math.max(1, g.bottom - liquidTop)));
  const topColor = bands.length ? bands[bands.length - 1].color : "#BFE7F5";
  const glow = bands.length ? bands.reduce((c, b) => mix(c, b.color, 0.5), topColor) : "#BFE7F5";

  const [sl, sr] = g.inner(surface);
  const sCx = (sl + sr) / 2;
  const sRx = (sr - sl) / 2 - 0.5;
  const sRy = Math.max(2.5, sRx * 0.13);

  // Hielo: cubos repartidos en la altura del líquido (uno asoma sobre la superficie) o hielo picado
  const cubes: { x: number; y: number; a: number; s: number }[] = [];
  if (full && look.ice === "cubos") {
    const n = shape === "tall" ? 5 : shape === "mug" ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const cy = surface - 4 + ((g.bottom - surface - 20) * i) / Math.max(1, n - 1) + rand() * 6;
      const [l, r] = g.inner(cy);
      const s = Math.min(13, (r - l) / 4);
      cubes.push({ x: (i % 2 ? r - s * 1.6 : l + s * 1.6) + (rand() - 0.5) * 8, y: cy, a: rand() * 70 - 35, s: s * (0.85 + rand() * 0.25) });
    }
  }
  const crushed: { x: number; y: number; k: number; o: number }[] = [];
  if (full && look.ice === "picado") {
    for (let i = 0; i < 26; i++) {
      const cy = surface + rand() * (g.bottom - surface - 6);
      const [l, r] = g.inner(cy);
      crushed.push({ x: l + 4 + rand() * (r - l - 8), y: cy, k: 3 + rand() * 4, o: 0.3 + rand() * 0.35 });
    }
  }
  // Gotas de condensación por fuera, a la altura del líquido frío
  const drops: { x: number; y: number; r: number; trail: boolean }[] = [];
  if (full && look.ice && shape !== "coupe") {
    for (let i = 0; i < 16; i++) {
      const dy = surface + 8 + rand() * (g.bottom - surface - 14);
      const [l, r] = g.inner(dy);
      drops.push({ x: l + 3 + rand() * (r - l - 6), y: dy, r: 0.9 + rand() * 1.4, trail: rand() > 0.75 });
    }
  }
  const wallBubbles = full && look.fizzy ? Array.from({ length: 12 }, () => {
    const by = liquidTop + 6 + rand() * (g.bottom - liquidTop - 10);
    const [l, r] = g.inner(by);
    return { x: rand() > 0.5 ? l + 2 + rand() * 4 : r - 2 - rand() * 4, y: by, r: 0.6 + rand() * 1 };
  }) : [];

  return (
    <svg viewBox="0 0 160 250" className={className} role="img" aria-label={`Vaso con ${liquids.map((l) => INGREDIENT_BY_ID.get(l.id)?.name).join(", ") || "nada"}`}>
      <defs>
        <clipPath id={id("clip")}>
          <path d={g.clip} />
        </clipPath>
        <linearGradient id={id("liquid")} gradientUnits="userSpaceOnUse" x1="0" y1={liquidTop} x2="0" y2={g.bottom}>
          {stops.map((s, i) => (
            <stop key={i} offset={off(s.at)} stopColor={s.color} />
          ))}
        </linearGradient>
        {/* Cilindro: oscuro en los bordes, una franja de luz a la izquierda */}
        <linearGradient id={id("cyl")} gradientUnits="userSpaceOnUse" x1={g.rim.x0} x2={g.rim.x1} y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.4" />
          <stop offset="0.14" stopColor="#000" stopOpacity="0.08" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="0.46" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.84" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={id("depth")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={id("streak")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("ice")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.26" />
        </linearGradient>
        {/* Núcleo nublado del hielo (el aire atrapado al congelarse) */}
        <radialGradient id={id("icecore")} cx="0.45" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("foam")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFCF2" />
          <stop offset="1" stopColor={look.foam === "cerveza" ? "#F3E6C2" : "#EADFC2"} />
        </linearGradient>
        <radialGradient id={id("scoop")} cx="0.38" cy="0.32" r="0.72">
          <stop offset="0" stopColor="#FFF9DA" />
          <stop offset="0.55" stopColor="#F4DE8A" />
          <stop offset="1" stopColor="#C9A94B" />
        </radialGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("caustic")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("mint")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ACD86" />
          <stop offset="1" stopColor="#2A8F4E" />
        </linearGradient>
        <pattern id={id("missing")} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="transparent" />
          <rect width="3" height="8" fill="#E4B853" fillOpacity="0.55" />
        </pattern>
      </defs>

      {/* La mesa: sombra y la luz de color que atraviesa el trago */}
      <ellipse cx="80" cy={243} rx={g.foot.rx + 18} ry="5.5" fill={ref("shadow")} />
      {full && <ellipse cx="90" cy={245} rx={g.foot.rx} ry="3.6" fill={ref("caustic")} />}

      <g clipPath={ref("clip")}>
        {full && (
          <>
            <g key={`pour-${pour}`} className="pour-fill" style={pourStyle}>
            <rect x="0" y={liquidTop} width="160" height={g.bottom - liquidTop + 1} fill={ref("liquid")} />
            {bands.map((b) =>
              missingIds?.has(b.l.id) ? <rect key={`m-${b.l.id}`} x="0" y={b.y0} width="160" height={b.y1 - b.y0} fill={ref("missing")} /> : null
            )}
            {/* Guarnición sumergida: rodaja de naranja o de pepino, hojas de menta machacadas, jengibre */}
            {look.orange && shape !== "tall" && (
              <g transform={`translate(${sCx + 8} ${surface + 26}) rotate(-12)`}>
                <ellipse rx="17" ry="15" fill="#E8801A" />
                <ellipse rx="15.4" ry="13.6" fill="#FFF1DC" />
                <ellipse rx="14" ry="12.3" fill="#FFB347" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                  <path key={k} d={`M0 0 L${(Math.cos((k * Math.PI) / 4) * 13).toFixed(1)} ${(Math.sin((k * Math.PI) / 4) * 11.5).toFixed(1)}`} stroke="#FFF1DC" strokeWidth="0.9" />
                ))}
              </g>
            )}
            {look.cucumber && (
              <g transform={`translate(${sCx - 10} ${surface + 34}) rotate(70)`}>
                <ellipse rx="16" ry="5" fill="#3E7D2C" />
                <ellipse rx="14.5" ry="3.8" fill="#CFE9B8" />
              </g>
            )}
            {look.mint &&
              [0, 1, 2].map((k) => (
                <path key={k} d="M0 0 C4 -6.5 12 -6.5 16 0 C12 6.5 4 6.5 0 0 Z" fill="#2E8C4F" opacity="0.75" transform={`translate(${sl + 10 + k * 18} ${g.bottom - 18 - k * 9}) rotate(${-20 + k * 35})`} />
              ))}
            {look.ginger &&
              [0, 1].map((k) => <ellipse key={k} cx={sCx - 12 + k * 22} cy={g.bottom - 22 - k * 30} rx="7" ry="3" fill="#F1DE9C" opacity="0.85" transform={`rotate(${15 - k * 30} ${sCx - 12 + k * 22} ${g.bottom - 22 - k * 30})`} />)}

            </g>

            {/* Hielo con volumen: cae al vaso con un rebote al servir */}
            {cubes.map((c, i) => (
              <g key={`c${i}-${pour}`} className="ice-drop" style={{ "--i": i } as React.CSSProperties}>
              <g transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.a.toFixed(0)})`}>
                <rect x={-c.s} y={-c.s} width={c.s * 2} height={c.s * 2} rx={c.s * 0.22} fill={ref("ice")} stroke="#fff" strokeOpacity="0.45" strokeWidth="0.8" />
                <rect x={-c.s} y={-c.s} width={c.s * 2} height={c.s * 2} rx={c.s * 0.22} fill={ref("icecore")} />
                <path d={`M${c.s - 1.5} ${-c.s + 4} L${c.s - 1.5} ${c.s - 1.5} L${-c.s + 4} ${c.s - 1.5}`} stroke="#000" strokeOpacity="0.2" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <path d={`M${-c.s + 2.5} ${c.s - 5} L${-c.s + 2.5} ${-c.s + 2.5} L${c.s - 5} ${-c.s + 2.5}`} stroke="#fff" strokeOpacity="0.85" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <circle cx={c.s * 0.3} cy={c.s * 0.25} r="0.8" fill="#fff" fillOpacity="0.6" />
              </g>
              </g>
            ))}
            {crushed.map((c, i) => (
              <path
                key={`p${i}`}
                d={`M${c.x - c.k} ${c.y - c.k * 0.4} L${c.x + c.k * 0.3} ${c.y - c.k} L${c.x + c.k} ${c.y + c.k * 0.2} L${c.x - c.k * 0.2} ${c.y + c.k} Z`}
                fill="#fff"
                fillOpacity={c.o}
                stroke="#fff"
                strokeOpacity="0.65"
                strokeWidth="0.5"
              />
            ))}

            {/* Volumen del líquido: cilindro y profundidad (suben con el líquido) */}
            <g key={`vol-${pour}`} className="pour-fill" style={pourStyle}>
              <rect x="0" y={liquidTop} width="160" height={g.bottom - liquidTop + 1} fill={ref("cyl")} />
              <rect x="0" y={liquidTop} width="160" height={g.bottom - liquidTop + 1} fill={ref("depth")} />
            </g>

            {/* Burbujas: suben por el centro y otras quedan pegadas a la pared */}
            {look.fizzy &&
              [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <circle
                  key={`b${i}`}
                  cx={sl + 8 + ((i * 37) % Math.max(10, sr - sl - 16))}
                  cy={g.bottom - 6}
                  r={1.2 + (i % 3) * 0.6}
                  fill="none"
                  stroke="#fff"
                  strokeOpacity="0.75"
                  strokeWidth="0.7"
                  className="animate-canister-bubble"
                  style={{ animationDelay: `${i * 0.3}s`, transformBox: "fill-box" }}
                />
              ))}
            {wallBubbles.map((b, i) => (
              <circle key={`w${i}`} cx={b.x} cy={b.y} r={b.r} fill="#fff" fillOpacity="0.45" />
            ))}

            <g key={`top-${pour}`} className="pour-fill" style={pourStyle}>
            {/* Espuma (clara o cerveza) sobre el líquido */}
            {foamH > 0 && (
              <>
                <rect x="0" y={surface} width="160" height={foamH + 1} fill={ref("foam")} />
                {Array.from({ length: 18 }, (_, i) => (
                  <circle key={`f${i}`} cx={sl + 4 + ((i * 29) % Math.max(10, sr - sl - 8))} cy={surface + 3 + ((i * 7) % Math.max(4, foamH - 4))} r={0.8 + (i % 3) * 0.5} fill="#fff" fillOpacity="0.6" stroke="#B8A26B" strokeOpacity="0.25" strokeWidth="0.4" />
                ))}
              </>
            )}

            {/* Superficie con perspectiva y un oleaje suave */}
            <ellipse cx={sCx} cy={surface} rx={sRx} ry={sRy} fill={foamH ? "#FFFDF6" : lighten(topColor, 0.18)} fillOpacity={foamH ? 1 : 0.92} stroke="#fff" strokeOpacity="0.32" strokeWidth="0.8" />
            {!foamH && (
              <g className="animate-liquid-wave" style={{ transformBox: "fill-box" }}>
                <path d={`M0 ${surface + 3} q10 -2.5 20 0 ${"t20 0 ".repeat(15)}`} stroke="#fff" strokeOpacity="0.14" strokeWidth="1.2" fill="none" />
              </g>
            )}
            {look.bitters && foamH > 0 && [-14, 0, 14].map((dx) => <ellipse key={dx} cx={sCx + dx} cy={surface + (dx === 0 ? -1 : 0.6)} rx="2.6" ry="1" fill="#7A2E12" />)}
            </g>
          </>
        )}
      </g>

      {/* Bola de helado (terremoto): flota y asoma sobre el borde, con su chorrito */}
      {full && look.scoop && (
        <g>
          <circle cx={sCx} cy={surface - 6} r="22" fill={ref("scoop")} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <circle key={k} cx={sCx - 12 + ((k * 13) % 26)} cy={surface - 16 + ((k * 7) % 18)} r="1.6" fill="none" stroke="#A88A3A" strokeOpacity="0.35" strokeWidth="0.6" />
          ))}
          {look.drizzle && <path d={`M${sCx - 16} ${surface - 16} C${sCx - 8} ${surface - 26} ${sCx} ${surface - 8} ${sCx + 8} ${surface - 20} S${sCx + 18} ${surface - 12} ${sCx + 18} ${surface - 4}`} stroke={darken(look.drizzle, 0.1)} strokeWidth="3" fill="none" strokeLinecap="round" />}
        </g>
      )}

      {/* Bombilla: arriba de la superficie se ve entera; bajo el líquido, corrida por la refracción */}
      {full && look.straw && (
        <g>
          <path d={`M${sCx + 6} ${g.bottom - 10} L${sCx + 20} ${surface}`} stroke="#2B2D36" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" clipPath={ref("clip")} transform="translate(3 0)" />
          <path d={`M${sCx + 20} ${surface} L${sCx + 34} ${g.rim.y - 28}`} stroke="#2B2D36" strokeWidth="5" strokeLinecap="round" />
          <path d={`M${sCx + 19} ${surface - 2} L${sCx + 32.6} ${g.rim.y - 27}`} stroke="#fff" strokeOpacity="0.35" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      )}

      {/* El vidrio: paredes, reflejos, borde y base gruesa o pie */}
      <path d={g.outline} fill={ref("glass")} stroke="#fff" strokeOpacity="0.38" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={g.streak} stroke={ref("streak")} strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx={(g.rim.x0 + g.rim.x1) / 2} cy={g.rim.y} rx={(g.rim.x1 - g.rim.x0) / 2} ry={(g.rim.x1 - g.rim.x0) * 0.05} fill="#fff" fillOpacity="0.04" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" />
      {(look.salt || look.sugar) && (
        <ellipse cx={(g.rim.x0 + g.rim.x1) / 2} cy={g.rim.y} rx={(g.rim.x1 - g.rim.x0) / 2} ry={(g.rim.x1 - g.rim.x0) * 0.05} fill="none" stroke="#fff" strokeWidth="3.2" strokeDasharray="0.1 2.1" strokeLinecap="round" />
      )}
      <ellipse cx="80" cy={g.foot.y} rx={g.foot.rx} ry="3.4" fill="#fff" fillOpacity="0.07" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" />

      {/* Vidrio empañado: gotas por fuera donde está el líquido frío */}
      {drops.map((d, i) => (
        <g key={`d${i}`}>
          {d.trail && <path d={`M${d.x} ${d.y - 7} L${d.x} ${d.y - 1}`} stroke="#fff" strokeOpacity="0.22" strokeWidth={d.r} strokeLinecap="round" />}
          <circle cx={d.x} cy={d.y} r={d.r} fill="#fff" fillOpacity="0.16" stroke="#fff" strokeOpacity="0.38" strokeWidth="0.5" />
          <circle cx={d.x - d.r * 0.35} cy={d.y - d.r * 0.35} r={d.r * 0.3} fill="#fff" fillOpacity="0.85" />
        </g>
      ))}

      {/* Guarnición en el borde: gajo de limón, menta que asoma, frutilla, canela. Llega al final del servido. */}
      <g key={`garnish-${pour}`} className="garnish-pop">
      {full && look.citrus && !look.orange && (
        <g transform={`translate(${g.rim.x1 - 10} ${g.rim.y - 2}) rotate(-28)`}>
          <path d="M-15 0 A15 15 0 0 1 15 0 Z" fill="#5E9E22" />
          <path d="M-13.4 0 A13.4 13.4 0 0 1 13.4 0 Z" fill="#F2F8D5" />
          <path d="M-12 0 A12 12 0 0 1 12 0 Z" fill="#CDE86A" />
          {[30, 60, 90, 120, 150].map((a) => (
            <path key={a} d={`M0 0 L${(Math.cos((a * Math.PI) / 180) * 11.5).toFixed(1)} ${(-Math.sin((a * Math.PI) / 180) * 11.5).toFixed(1)}`} stroke="#F2F8D5" strokeWidth="1" />
          ))}
        </g>
      )}
      {full && look.orange && shape === "tall" && (
        <g transform={`translate(${g.rim.x1 - 10} ${g.rim.y - 2}) rotate(-28)`}>
          <path d="M-16 0 A16 16 0 0 1 16 0 Z" fill="#E8801A" />
          <path d="M-14.2 0 A14.2 14.2 0 0 1 14.2 0 Z" fill="#FFF1DC" />
          <path d="M-12.8 0 A12.8 12.8 0 0 1 12.8 0 Z" fill="#FFB347" />
        </g>
      )}
      {full && look.mint && (
        <g transform={`translate(${g.rim.x0 + 22} ${g.rim.y + 4})`}>
          <path d="M0 0 L4 -16" stroke="#2A8F4E" strokeWidth="1.4" />
          {[
            [-2, -10, -150, 13],
            [3, -16, -110, 14],
            [5, -12, -40, 12],
          ].map(([x, yy, a, s], k) => (
            <g key={k} transform={`translate(${x} ${yy}) rotate(${a}) scale(${(s / 16).toFixed(2)})`}>
              <path d="M0 0 C4 -6.5 12 -6.5 16 0 C12 6.5 4 6.5 0 0 Z" fill={ref("mint")} stroke="#1F7A41" strokeWidth="0.5" />
              <path d="M0.5 0 L15 0" stroke="#1F7A41" strokeWidth="0.6" />
            </g>
          ))}
        </g>
      )}
      {full && look.strawberry && (
        <g transform={`translate(${g.rim.x0 + 14} ${g.rim.y - 6})`}>
          <path d="M0 10 C-7 5 -7 -4 0 -4 C7 -4 7 5 0 10 Z" fill="#D7263D" stroke="#9E1B2C" strokeWidth="0.6" />
          <path d="M-3 -4 L0 -8 L3 -4" stroke="#3DBE6B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {full && look.cinnamon && <path d={`M${sCx - 22} ${surface + 20} L${sCx - 40} ${g.rim.y - 22}`} stroke="#8B4513" strokeWidth="4.5" strokeLinecap="round" />}
      </g>
    </svg>
  );
}
