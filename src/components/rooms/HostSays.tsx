"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import HostNeonSvg from "@/components/gateway/club3d/HostNeonSvg";
import { sfx } from "./sfx";

/**
 * El host conversa: su figura de neón con un globo que escribe la frase letra a letra. Cambia de frase solo cada
 * tanto (o al tocarlo, y entonces te contesta con un gesto). Los lectores de pantalla reciben la frase completa una
 * vez; el tipeo es solo visual. Con movimiento reducido la frase aparece entera y no rota sola.
 */
export default function HostSays({ lines, className = "", size = "md", tone = "neon" }: { lines: string[]; className?: string; size?: "sm" | "md" | "lg"; tone?: "neon" | "casino" }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const [poke, setPoke] = useState(0);
  const reduce = useRef(false);
  const line = lines[i % Math.max(1, lines.length)] ?? "";

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  // Si cambian las frases (otra sección, otra hora), parte de la primera
  const key = lines.join("|");
  useEffect(() => {
    setI(0);
  }, [key]);

  // Tipeo: unas 34 letras por segundo, con una pausa breve en cada coma
  useEffect(() => {
    if (reduce.current) {
      setTyped(line.length);
      return;
    }
    setTyped(0);
    let n = 0;
    let t = 0;
    const tick = () => {
      n++;
      setTyped(n);
      if (n < line.length) t = window.setTimeout(tick, /[,.:?!]/.test(line[n - 1]) ? 180 : 28);
    };
    t = window.setTimeout(tick, 260);
    return () => window.clearTimeout(t);
  }, [line]);

  // Cambia de tema solo cada tanto mientras se mira
  useEffect(() => {
    if (reduce.current || lines.length < 2) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((k) => k + 1);
    }, 9000);
    return () => window.clearInterval(t);
  }, [lines.length, key]);

  const next = useCallback(() => {
    setI((k) => k + 1);
    setPoke((p) => p + 1);
    sfx.clink();
  }, []);

  const fig = size === "lg" ? "h-40 w-40 sm:h-52 sm:w-52" : size === "sm" ? "h-16 w-16" : "h-24 w-24 sm:h-32 sm:w-32";
  return (
    <div className={`host-says flex items-end gap-2 ${className}`}>
      <button type="button" onClick={next} aria-label="Hablar con el host" className={`host-figure shrink-0 ${fig}`} key={poke}>
        <HostNeonSvg className="h-full w-full" palette={tone === "casino" ? "gold" : "neon"} />
      </button>
      <p
        className={`host-bubble relative mb-3 max-w-[24rem] rounded-2xl rounded-bl-md border px-4 py-3 text-sm font-semibold leading-snug backdrop-blur-md sm:text-base ${
          tone === "casino"
            ? "border-[#D4AF37]/45 bg-[#07231B]/80 text-[#F5F0E6] shadow-[0_12px_40px_-12px_rgba(212,175,55,0.5)]"
            : "border-indigo-300/25 bg-night-950/70 text-indigo-50 shadow-[0_12px_40px_-12px_rgba(103,170,255,0.45)]"
        }`}
      >
        <span className="sr-only" aria-live="polite">
          {line}
        </span>
        <span aria-hidden>
          {line.slice(0, typed)}
          <span className={`ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] align-baseline ${tone === "casino" ? "bg-[#ECC85F]" : "bg-indigo-200"} ${typed < line.length ? "animate-pulse" : "opacity-0"}`} />
        </span>
      </p>
    </div>
  );
}
