"use client";

import React, { useRef, useState } from "react";
import { audioEffects } from "@/lib/audioEffects";

/** Grados que baja la palanca al fondo, y desde cuántos cuenta como tirada */
const MAX = 70;
const PULL_AT = 46;

/**
 * Palanca de tragamonedas de verdad: se agarra la bola y se tira hacia abajo (el brazo gira hacia ti desde la base),
 * con resistencia al final y un clac al llegar; al soltar vuelve con resorte. Un toque, Enter o Espacio la tiran con
 * la misma animación, así sirve con teclado y lector de pantalla. Con movimiento reducido no hay recorrido.
 */
export default function SlotLever({ onPull, size = "md", disabled = false, label = "Tirar la palanca" }: { onPull: () => void; size?: "md" | "lg"; disabled?: boolean; label?: string }) {
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; pulled: boolean } | null>(null);
  const moved = useRef(false);
  const big = size === "lg";
  const travel = big ? 150 : 90;

  const fire = () => {
    audioEffects.playTick(220, 0.08);
    audioEffects.triggerHaptic(30);
    onPull();
  };

  /** Tirada automática (toque o teclado): baja, clac y vuelve */
  const auto = () => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fire();
      return;
    }
    setAngle(MAX);
    window.setTimeout(() => {
      fire();
      setAngle(0);
    }, 260);
  };

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    start.current = { y: e.clientY, pulled: false };
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    const dy = Math.max(0, e.clientY - s.y);
    if (dy > 6) moved.current = true;
    // Resistencia: cuesta más al final del recorrido
    const a = MAX * (1 - Math.exp(-dy / (travel * 0.6)));
    setAngle(a);
    if (a >= PULL_AT && !s.pulled) {
      s.pulled = true;
      fire();
    }
  };
  const up = () => {
    start.current = null;
    setDragging(false);
    setAngle(0);
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={() => {
        // Un toque sin arrastre también tira (el arrastre ya disparó al pasar el punto)
        if (!moved.current) auto();
        moved.current = false;
      }}
      className={`slot-lever group relative touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50 ${big ? "h-64 w-28" : "h-36 w-16"}`}
      style={{ perspective: "600px" }}
    >
      <span aria-hidden className="absolute inset-x-0 bottom-0 mx-auto block" style={{ width: big ? 56 : 32 }}>
        {/* Base atornillada al gabinete */}
        <span className={`slot-lever-base absolute bottom-0 left-1/2 block -translate-x-1/2 rounded-lg ${big ? "h-10 w-14" : "h-6 w-8"}`} />
        {/* Brazo: gira hacia ti desde la base */}
        <span
          className="absolute bottom-[40%] left-1/2 block origin-bottom"
          style={{
            height: big ? 190 : 104,
            width: big ? 12 : 7,
            marginLeft: big ? -6 : -3.5,
            transform: `rotateX(${-angle.toFixed(1)}deg)`,
            transition: dragging ? "none" : "transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span className="slot-lever-arm absolute inset-0 block rounded-full" />
          <span className={`slot-knob absolute left-1/2 block -translate-x-1/2 rounded-full ${big ? "-top-9 h-14 w-14" : "-top-5 h-8 w-8"}`} />
        </span>
      </span>
    </button>
  );
}
