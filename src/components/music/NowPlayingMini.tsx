"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Disc3 } from "lucide-react";
import { SOLO, useCarreteStore } from "@/store/useCarreteStore";
import { resolveNowPlaying } from "@/lib/music";
import { useLocale } from "@/lib/useLocale";

/** Reproductor compacto de la sala (Spotify embebido, sin login). */
export default function NowPlayingMini({ code = SOLO }: { code?: string }) {
  const { country } = useLocale();
  const { state } = useCarreteStore(code);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  if (!now) return null;
  const np = resolveNowPlaying(state.music, { country, now, state });

  return (
    <div className="surface overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="flex items-end gap-[2px] h-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[3px] h-full origin-bottom rounded-full bg-emerald-400 animate-eq-bar" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
        <p className="eyebrow !text-[10px] truncate">{np.reason ?? "Sonando"}</p>
        <Link href="/musica" className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200">
          <Disc3 className="w-3.5 h-3.5" /> DJ
        </Link>
      </div>
      <iframe
        title={`Spotify: ${np.title}`}
        src={np.embed}
        width="100%"
        height="80"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block rounded-2xl border-0"
      />
    </div>
  );
}
