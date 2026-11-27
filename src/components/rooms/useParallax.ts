"use client";

import { useEffect, useRef } from "react";

/** Permiso del giroscopio ya concedido en esta visita (iOS lo pide con un toque; Android no lo pide) */
const GYRO_KEY = "tonight_gyro";

/** Pide el giroscopio en iOS (debe llamarse dentro de un toque). En Android y escritorio no hace nada */
export async function askGyro() {
  try {
    const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (D?.requestPermission) {
      const r = await D.requestPermission();
      if (r === "granted") sessionStorage.setItem(GYRO_KEY, "1");
    }
  } catch {
    /* sin permiso: queda el puntero */
  }
}

/**
 * Paralaje de una capa: sigue al puntero en escritorio y la inclinación del celular (giroscopio) en el táctil, con un
 * resorte suave para que nunca salte. Escribe el transform directo en el elemento (sin re-render). `amount` en % del
 * tamaño de la capa. Con movimiento reducido no se mueve.
 */
export function useParallax<T extends HTMLElement>(amount = 1.6, onTilt?: (x: number, y: number) => void) {
  const ref = useRef<T>(null);
  const tilt = useRef(onTilt);
  tilt.current = onTilt;
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let running = false;
    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.transform = `translate3d(${(-x * amount).toFixed(3)}%, ${(-y * amount * 0.6).toFixed(3)}%, 0) scale(1.06)`;
      tilt.current?.(x, y);
      if (Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    const onTiltEvt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // Inclinación cómoda: ±20° de lado y alrededor de 45° de frente (cómo se sostiene el celular)
      tx = Math.max(-1, Math.min(1, e.gamma / 20));
      ty = Math.max(-1, Math.min(1, (e.beta - 45) / 20));
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const needsAsk = !!(window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent?.requestPermission;
    let gyro = false;
    try {
      gyro = touch && (!needsAsk || sessionStorage.getItem(GYRO_KEY) === "1");
    } catch {
      gyro = touch && !needsAsk;
    }
    if (gyro) window.addEventListener("deviceorientation", onTiltEvt, { passive: true });
    el.style.transform = "scale(1.06)";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTiltEvt);
    };
  }, [amount]);
  return ref;
}
