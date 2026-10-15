"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCarreteStore } from "@/store/useCarreteStore";
import { LIVE_GAME_BY_ID } from "@/lib/liveGames";

/** Píldora flotante en móvil: hay una ronda en vivo y aún no votas. */
export default function LiveNudge({ code }: { code: string }) {
  const pathname = usePathname() || "";
  const store = useCarreteStore(code);
  const round = store.state.live?.round;
  const me = store.meId;
  if (!round || round.revealedAt || !me || round.votes[me]) return null;
  if (pathname.startsWith(`/carrete/${code}`) || pathname.startsWith("/juegos")) return null;
  const g = LIVE_GAME_BY_ID.get(round.game);
  return (
    <Link
      href={`/carrete/${code}?modo=celular`}
      className="xl:hidden fixed inset-x-6 bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] z-40 flex items-center gap-3 rounded-full border border-indigo-300/40 bg-indigo-500 px-5 py-3 text-sm font-bold text-night-950 shadow-glow animate-rise-in lg:bottom-6 lg:left-auto lg:right-6 lg:w-80"
    >
      <span className="text-lg">{g?.emoji}</span>
      <span className="flex-1 truncate">Ronda en vivo: {g?.name}</span>
      <span className="rounded-full bg-night-950/15 px-2.5 py-0.5 text-xs">Votar</span>
    </Link>
  );
}
