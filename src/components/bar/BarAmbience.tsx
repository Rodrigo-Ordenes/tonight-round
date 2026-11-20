import React from "react";
import BackBar from "@/components/ui/BackBar";

/** Luces del bar fuera de foco: [izquierda, arriba, tamaño en px, color, desfase en s] */
const LIGHTS: [string, string, number, string, number][] = [
  ["6%", "18%", 120, "rgba(103,170,255,0.32)", 0],
  ["22%", "52%", 70, "rgba(185,62,243,0.3)", 1.6],
  ["38%", "10%", 54, "rgba(140,227,190,0.22)", 3.1],
  ["55%", "38%", 140, "rgba(185,62,243,0.24)", 0.8],
  ["70%", "8%", 82, "rgba(103,170,255,0.3)", 2.4],
  ["84%", "46%", 110, "rgba(228,184,83,0.18)", 4],
  ["93%", "14%", 60, "rgba(140,227,190,0.24)", 1.2],
];

/**
 * Ambiente detrás de la cabecera del Bar: la contrabarra de la intro «La ronda» (el mismo bar en toda la app) y luces
 * desenfocadas, cada plano a su profundidad: la repisa se queda atrás al bajar y las luces van a otro ritmo y titilan
 * lento. Decorativo; con movimiento reducido queda quieto.
 */
export default function BarAmbience() {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-20 -z-20 h-[26rem] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_45%,transparent)] sm:-inset-x-6">
      <div className="parallax-deep absolute inset-x-0 top-0 h-[24rem]">
        <BackBar opacity={0.34} preserveAspectRatio="xMidYMin slice" className="h-full w-full" />
      </div>
      <div className="parallax-mid absolute inset-0">
        {LIGHTS.map(([left, top, size, color, delay]) => (
          <span key={`${left}-${top}`} className="bokeh absolute rounded-full" style={{ left, top, width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );
}
