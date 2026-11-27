"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Fichas de casino de verdad (solo puntos): cuerpo de color con las franjas del canto, anillo interior y el valor al
 * centro. Colores por denominación, en la paleta del casino de Tonight: marfil, azul, paño, laca negra con oro y morado
 * real con oro (nada rojo).
 */
export const DENOMS = [5, 10, 25, 50, 100] as const;
export type Denom = (typeof DENOMS)[number];

const STYLE: Record<Denom, { base: string; stripe: string; text: string }> = {
  5: { base: "#F5F0E6", stripe: "#1E5BB8", text: "#0B0B0F" },
  10: { base: "#1E5BB8", stripe: "#F5F0E6", text: "#F5F0E6" },
  25: { base: "#1F6F54", stripe: "#F5F0E6", text: "#F5F0E6" },
  50: { base: "#0B0B0F", stripe: "#D4AF37", text: "#ECC85F" },
  100: { base: "#5E1F86", stripe: "#ECC85F", text: "#F7E3A1" },
};
/** La ficha más grande que cabe en un monto (para dibujar pilas que se lean) */
export const denomFor = (amount: number): Denom => ([...DENOMS].reverse().find((d) => amount >= d) ?? 5) as Denom;

/** Una ficha vista de frente */
export function ChipFace({ value, className = "" }: { value: Denom; className?: string }) {
  const s = STYLE[value];
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden>
      <circle r="48" fill={s.base} />
      {/* Franjas del canto */}
      {Array.from({ length: 8 }, (_, k) => (
        <rect key={k} x="-6" y="-48" width="12" height="12" rx="1.5" fill={s.stripe} transform={`rotate(${k * 45})`} />
      ))}
      <circle r="36" fill="none" stroke={s.stripe} strokeOpacity="0.85" strokeWidth="2" strokeDasharray="5 4" />
      <circle r="31" fill={s.base} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle r="48" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <text y="1" textAnchor="middle" dominantBaseline="central" fontSize={value >= 100 ? 24 : 28} fontWeight="900" fill={s.text} fontFamily="ui-monospace, Menlo, monospace">
        {value}
      </text>
    </svg>
  );
}

/**
 * Pila de fichas sobre el paño, en perspectiva: cada ficha es un óvalo con su canto. `amount` se arma con las fichas
 * más grandes posibles (como lo haría el crupier).
 */
export function ChipPile({ amount, size = 52, className = "" }: { amount: number; size?: number; className?: string }) {
  const chips: Denom[] = [];
  let left = amount;
  while (left >= 5 && chips.length < 14) {
    const d = denomFor(left);
    chips.push(d);
    left -= d;
  }
  if (!chips.length) return null;
  return (
    <span aria-hidden className={`relative inline-block ${className}`} style={{ width: size, height: size * 0.62 + chips.length * 4 }}>
      {chips.map((d, k) => {
        const s = STYLE[d];
        return (
          <span key={k} className="absolute left-0" style={{ bottom: k * 4, width: size, height: size * 0.62 }}>
            {/* Canto */}
            <span className="absolute inset-x-0 bottom-0 rounded-[50%]" style={{ height: size * 0.62, background: `repeating-linear-gradient(90deg, ${s.base} 0 8px, ${s.stripe} 8px 12px)`, filter: "brightness(0.72)" }} />
            {/* Cara */}
            <ChipFace value={d} className="absolute inset-x-0 top-[-3px]" />
          </span>
        );
      })}
    </span>
  );
}

/**
 * La bandeja de fichas del jugador: tocar una la suma a la apuesta (sube del riel con un saltito). Accesible como
 * botones con su valor.
 */
export function ChipRack({ onPick, disabled = false, selected, label = "Fichas" }: { onPick: (v: Denom) => void; disabled?: boolean; selected?: Denom; label?: string }) {
  const reduce = useReducedMotion();
  return (
    <div role="group" aria-label={label} className="casino-rack flex items-end gap-1.5 rounded-2xl px-3 pb-2 pt-3 sm:gap-2">
      {DENOMS.map((d, i) => (
        <motion.button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onPick(d)}
          aria-label={`Ficha de ${d}`}
          aria-pressed={selected === undefined ? undefined : selected === d}
          className={`relative h-12 w-12 rounded-full transition-[filter,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:w-14 ${selected === d ? "ring-2 ring-[#F7E3A1] ring-offset-2 ring-offset-[#07231B]" : ""}`}
          initial={reduce ? false : { y: 14, opacity: 0 }}
          animate={{ y: selected === d ? -6 : 0, opacity: 1 }}
          whileTap={reduce || disabled ? undefined : { y: -10, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 24, delay: reduce ? 0 : i * 0.04 }}
        >
          <ChipFace value={d} className="h-full w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]" />
        </motion.button>
      ))}
    </div>
  );
}
