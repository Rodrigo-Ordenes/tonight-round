"use client";

import { useEffect, type RefObject } from "react";

const TRAVEL = 7; // px por unidad de profundidad con el celular inclinado al máximo
const RANGE = 28; // grados de inclinación que cubren todo el recorrido
const EASE = 0.08; // fracción del camino que se recorre por cuadro (resorte suave)

/**
 * Profundidad al inclinar el celular: cada `[data-tilt-depth]` dentro de `scope` se desplaza según su profundidad
 * (negativa = al fondo, contra el giro). La primera lectura es el punto neutro, así da igual cómo se sostenga.
 * Solo donde el sensor no pide permiso (Android); en iPhone pedirlo interrumpiría, así que queda quieto. Escribe
 * `translate` en cada capa (no variables en el padre) y se detiene cuando llega al reposo. `active` vuelve a montarlo
 * cuando la tarjeta aparece después del primer render.
 */
export function useTiltDepth(scope: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const root = scope.current;
    if (!active || !root || typeof DeviceOrientationEvent === "undefined") return;
    const needsPermission = typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function";
    if (needsPermission || !matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt-depth]")).map((el) => ({ el, depth: Number(el.dataset.tiltDepth ?? 0) }));
    let neutral: { beta: number; gamma: number } | null = null;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const frame = () => {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      for (const { el, depth } of layers) el.style.translate = `${(current.x * depth * TRAVEL).toFixed(2)}px ${(current.y * depth * TRAVEL).toFixed(2)}px`;
      const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
      raf = settled ? 0 : requestAnimationFrame(frame);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      neutral ??= { beta: e.beta, gamma: e.gamma };
      target.x = clamp((e.gamma - neutral.gamma) / RANGE);
      target.y = clamp((e.beta - neutral.beta) / RANGE);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(raf);
      for (const { el } of layers) el.style.translate = "";
    };
  }, [scope, active]);
}
