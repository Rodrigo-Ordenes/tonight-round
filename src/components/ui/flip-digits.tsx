"use client";

/**
 * Cifras de paleta (split-flap), como «FlipCountdown» de 21st.dev: cuando un dígito cambia, la mitad de arriba cae
 * sobre la de abajo con un giro en X, igual que un tablero de aeropuerto. Solo cambia el dígito que cambió.
 * Se usa para el reloj de la ronda en la TV (no para cifras de alcohol ni montos). Con movimiento reducido, cambio
 * directo.
 */
import React from "react";

export default function FlipDigits({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`flip-digits inline-flex gap-[0.08em] ${className}`} aria-hidden>
      {value.split("").map((ch, i) => (
        <FlipDigit key={i} ch={ch} />
      ))}
    </span>
  );
}

function FlipDigit({ ch }: { ch: string }) {
  const prev = React.useRef(ch);
  const [pair, setPair] = React.useState({ from: ch, to: ch, n: 0 });
  React.useEffect(() => {
    if (prev.current === ch) return;
    setPair((p) => ({ from: prev.current, to: ch, n: p.n + 1 }));
    prev.current = ch;
  }, [ch]);
  return (
    <span className="flip-digit relative inline-block w-[0.72em] text-center leading-none" style={{ perspective: "300px" }}>
      {/* Mitad de arriba: el nuevo; abajo: el viejo hasta que cae la paleta */}
      <Half pos="top" ch={pair.to} />
      <Half pos="bottom" ch={pair.n ? pair.from : pair.to} />
      {pair.n > 0 && (
        <React.Fragment key={pair.n}>
          <Half pos="top" ch={pair.from} anim="flip-fall" />
          <Half pos="bottom" ch={pair.to} anim="flip-land" />
        </React.Fragment>
      )}
      <span className="invisible block leading-[1.2em]">{pair.to}</span>
    </span>
  );
}

const Half = ({ pos, ch, anim = "" }: { pos: "top" | "bottom"; ch: string; anim?: string }) => (
  <span className={`flip-half flip-${pos} ${anim}`}>
    <span className="flip-glyph">{ch}</span>
  </span>
);
