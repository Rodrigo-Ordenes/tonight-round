"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RoomVideo from "@/components/rooms/RoomVideo";
import HostSays from "@/components/rooms/HostSays";
import { warmAudio } from "@/components/rooms/sfx";

/**
 * La mesa a pantalla completa: llegas directo y quedas sentado en ella. Detrás, el salón del casino desenfocado; arriba,
 * la luz cálida de la lámpara sobre el paño; el host de crupier (en oro) habla según la jugada. Arriba, volver al casino,
 * el nombre de la mesa y tus créditos en el marcador. Solo puntos: nadie apuesta plata.
 */
export default function MesaShell({
  id,
  title,
  credits,
  lines,
  children,
  host = "arriba",
}: {
  id: string;
  title: string;
  credits: number;
  lines: string[];
  children: React.ReactNode;
  /** Dónde habla el host: sobre la mesa (crupier), debajo (en las máquinas) o lo pone la mesa misma (`propio`) */
  host?: "arriba" | "abajo" | "propio";
}) {
  // En la mesa todo suena (cartas, fichas, la bola): el audio se prepara antes de la primera jugada
  useEffect(() => warmAudio(), []);
  return (
    <section
      aria-labelledby={`mesa-${id}`}
      data-mesa={id}
      className="mesa-casino theme-casino relative isolate -mt-[calc(4.75rem+env(safe-area-inset-top,0px))] min-h-[100svh] overflow-hidden lg:-mt-24"
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
    >
      <RoomVideo name="juegos" veil="casino-full" className="mesa-salon" />
      <div aria-hidden className="mesa-lamp pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col gap-3 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] pt-[calc(env(safe-area-inset-top,0px)+4.25rem)] sm:px-6 lg:pt-20">
        <header className="flex items-center justify-between gap-3">
          <Link href="/casino" className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-[#07231B]/70 px-3.5 text-sm font-semibold text-[#F5F0E6] backdrop-blur-md transition-colors hover:border-[#ECC85F]/70">
            <ArrowLeft className="h-4 w-4" aria-hidden /> El casino
          </Link>
          <h1 id={`mesa-${id}`} className="display casino-title truncate text-center text-2xl sm:text-4xl">
            {title}
          </h1>
          <span className="credit-led rounded-xl px-3 py-2 font-led text-xs font-bold tracking-[0.18em] sm:text-sm" aria-label={`Tus créditos: ${credits}`}>
            {String(credits).padStart(5, "0")}
          </span>
        </header>
        {host === "arriba" && <HostSays lines={lines} tone="casino" size="sm" className="mx-auto -mb-2 justify-center" />}
        <div className="flex flex-1 flex-col">{children}</div>
        {host === "abajo" && <HostSays lines={lines} tone="casino" size="sm" className="mx-auto" />}
        <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#F5F0E6]/45">Solo puntos · nadie apuesta plata · perder nunca obliga a tomar</p>
      </div>
    </section>
  );
}
