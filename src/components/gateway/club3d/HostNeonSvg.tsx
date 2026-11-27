import React, { useId, useMemo } from "react";
import { HOST_STROKES, sampleStroke } from "./hostNeon";

/** El host de neón en SVG (para cuando no hay 3D o se pidió menos movimiento): los mismos trazos, con su brillo */
/** Paletas del letrero: el neón de la casa (azul a morado, detalles menta) o el oro del casino (oro a bronce, marfil) */
const PALETTES = {
  neon: { a: [103, 170, 255], b: [185, 62, 243], detail: "#8CE3BE" },
  gold: { a: [247, 227, 161], b: [184, 144, 47], detail: "#F5F0E6" },
} as const;

export default function HostNeonSvg({ className, palette = "neon" }: { className?: string; palette?: keyof typeof PALETTES }) {
  const id = useId().replace(/:/g, "");
  const paths = useMemo(
    () =>
      HOST_STROKES.map((s) => {
        const pts = sampleStroke(s, 10);
        const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
        const t = Math.min(1, Math.max(0, (mx + 40) / 90));
        const P = PALETTES[palette];
        const color = s.tone === "mint" ? P.detail : `rgb(${P.a.map((v, k) => Math.round(v + (P.b[k] - v) * t)).join(",")})`;
        return { d: "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + (s.closed ? "Z" : ""), color };
      }),
    [palette],
  );
  return (
    <svg viewBox="-46 -8 116 104" className={className} aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <filter id={`g${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g strokeWidth="1.2" filter={`url(#g${id})`}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} stroke={p.color} />
        ))}
      </g>
      <g strokeWidth="0.35" stroke="#fff" strokeOpacity="0.7">
        {paths.map((p, i) => (
          <path key={i} d={p.d} />
        ))}
      </g>
    </svg>
  );
}
