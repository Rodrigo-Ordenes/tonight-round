"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParallax } from "./useParallax";

export type RoomVideoName = "bar" | "musica" | "juegos" | "sala" | "cuentas" | "dj";

/**
 * El ambiente vivo de un apartado: un video real en loop sin corte (public/video, Mixkit con licencia libre, ver
 * CREDITOS.md) detrás de todo. Pinta primero su póster (la primera cuadra) y el video entra cuando ya puede sonar;
 * en el celular baja la versión liviana. Se pausa fuera de la vista o con la pestaña oculta; con movimiento reducido o
 * ahorro de datos queda solo el póster. La capa sigue al puntero o a la inclinación del celular (paralaje).
 */
export default function RoomVideo({ name, className = "", veil = "bottom" }: { name: RoomVideoName; className?: string; veil?: "bottom" | "left" | "full" | "casino" | "casino-full" | "none" }) {
  const video = useRef<HTMLVideoElement>(null);
  const layer = useParallax<HTMLDivElement>(1.4);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || save) return;
    setSrc(`/video/${name}${window.matchMedia("(max-width: 700px)").matches ? "-sm" : ""}.mp4`);
  }, [name]);

  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    let seen = true;
    const sync = () => {
      if (seen && document.visibilityState === "visible") void v.play().catch(() => undefined);
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [src]);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#060609] ${className}`}>
      <div ref={layer} className="absolute inset-0 will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/video/${name}.webp`} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        {src && (
          <video
            ref={video}
            src={src}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setPlaying(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
      {/* Grano de película y velos para leer encima */}
      <div className="room-grain absolute inset-0" />
      {veil === "bottom" && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,9,0.72)_0%,rgba(6,6,9,0.18)_34%,rgba(6,6,9,0.35)_62%,#090A0D_100%)]" />}
      {veil === "left" && <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,9,0.9)_0%,rgba(6,6,9,0.55)_42%,rgba(6,6,9,0.2)_100%),linear-gradient(180deg,rgba(6,6,9,0.6)_0%,transparent_30%,transparent_70%,#090A0D_100%)]" />}
      {veil === "full" && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,9,0.78)_0%,rgba(6,6,9,0.86)_100%)]" />}
      {/* El casino: penumbra de paño esmeralda y laca negra, con la luz cálida de la lámpara sobre la mesa */}
      {veil === "casino" && <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(236,200,95,0.12),transparent_60%),linear-gradient(180deg,rgba(11,11,15,0.7)_0%,rgba(14,59,46,0.28)_36%,rgba(7,35,27,0.55)_66%,#07231B_100%)]" />}
      {veil === "casino-full" && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.8)_0%,rgba(7,35,27,0.88)_100%)]" />}
    </div>
  );
}
