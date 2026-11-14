import type { SVGProps } from "react";

/** Dos repisas con botellas [x, ancho, alto] en coordenadas del dibujo (400×400) */
const SHELVES: { y: number; bottles: [number, number, number][] }[] = [
  { y: 96, bottles: [[-80, 16, 44], [-50, 13, 52], [10, 18, 40], [40, 12, 48], [118, 15, 46], [210, 17, 42], [292, 13, 50], [360, 16, 44], [430, 14, 52], [470, 18, 40]] },
  { y: 158, bottles: [[-100, 18, 50], [-64, 14, 58], [-26, 20, 46], [100, 16, 54], [196, 20, 48], [300, 15, 56], [440, 19, 50], [482, 14, 58]] },
];

const bottlePath = (x: number, base: number, w: number, h: number) => {
  const top = base - h;
  const neck = 2.6;
  const r = w / 2;
  return `M ${x - neck} ${top} L ${x - neck} ${top + h * 0.22} C ${x - neck} ${top + h * 0.34} ${x - r} ${top + h * 0.36} ${x - r} ${top + h * 0.5} L ${x - r} ${base} L ${x + r} ${base} L ${x + r} ${top + h * 0.5} C ${x + r} ${top + h * 0.36} ${x + neck} ${top + h * 0.34} ${x + neck} ${top + h * 0.22} Z`;
};

/**
 * Contrabarra de Tonight: repisas con botellas en neón tenue. La misma en la intro «La ronda» y de fondo en la TV,
 * así la sala se siente el mismo bar. Decorativa (aria-hidden); recibe props del SVG para capas y atributos de datos.
 */
export default function BackBar({ opacity = 0.2, ...props }: SVGProps<SVGSVGElement> & { opacity?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 400 400" overflow="visible" {...props}>
      {SHELVES.map((shelf) => (
        <g key={shelf.y}>
          <path d={`M -140 ${shelf.y} L 540 ${shelf.y}`} style={{ stroke: "var(--violet-text)" }} strokeOpacity={opacity * 1.1} strokeWidth="1.2" />
          {shelf.bottles.map(([x, w, h], i) => (
            <path key={i} d={bottlePath(x, shelf.y, w, h)} fill="none" style={{ stroke: i % 3 === 1 ? "var(--blue)" : "var(--violet-text)" }} strokeOpacity={opacity} strokeWidth="1.1" strokeLinejoin="round" />
          ))}
        </g>
      ))}
    </svg>
  );
}
