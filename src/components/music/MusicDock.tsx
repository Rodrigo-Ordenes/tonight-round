"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, ListMusic, X } from "lucide-react";
import MusicEmbed from "./MusicEmbed";
import YouTubeQueuePlayer from "./YouTubeQueuePlayer";
import { musicDeck, useMusicDeck } from "@/lib/musicDeck";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import { resolveNowPlaying, songQueue } from "@/lib/music";
import { parseMusicLink } from "@/lib/musicLink";

/**
 * El reproductor que acompaña la visita (montado en el armazón: no se corta al cambiar de apartado). Toca lo que se
 * eligió en la pista —tu lista, el ambiente o el DJ automático— o la fila de pedidos con YouTube, que avanza sola.
 * Se recoge a una píldora sin dejar de sonar; en la pista se ve más grande.
 */
export default function MusicDock() {
  const deck = useMusicDeck();
  const pathname = usePathname() || "/";
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const { country } = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  const [skipped, setSkipped] = useState<string | null>(null);
  useEffect(() => setNow(new Date()), [deck.on]);
  // En el celular, fuera de la pista el reproductor se recoge solo a una barrita (sigue sonando, no tapa la escena)
  useEffect(() => {
    if (pathname !== "/musica" && window.matchMedia("(max-width: 700px)").matches) musicDeck.set({ folded: true });
  }, [pathname]);

  const music = store.state.music;
  const np = useMemo(() => (now ? resolveNowPlaying(music, { country, now, state: store.state }) : null), [music, now, country, store.state]);
  const playable = useMemo(
    () =>
      songQueue(music)
        .map((r) => ({ r, link: parseMusicLink(r.text) }))
        .filter((x) => x.link?.provider === "youtube" && !!x.link.embedUrl),
    [music],
  );

  if (!deck.on || !np) return null;
  const item = deck.mode === "fila" ? playable[0] : null;
  const big = pathname === "/musica";
  const title = item ? item.r.text : np.title;
  const open = item ? item.link!.openUrl : np.open;
  const next = () => {
    if (item) store.dispatch({ type: "SONG_PLAYED", id: item.r.id });
  };

  return (
    <aside
      aria-label="Reproductor de la noche"
      className={`fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+5.25rem)] right-3 z-40 overflow-hidden rounded-2xl border border-indigo-300/25 bg-night-950/90 shadow-lift backdrop-blur-xl ${
        big ? "left-3 sm:left-auto sm:w-[26rem]" : "left-3 sm:left-auto sm:w-[21rem]"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="eq-bars flex h-3.5 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-[3px] rounded-full bg-indigo-300" style={{ animationDelay: `${i * -0.13}s` }} />
          ))}
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200">
          {deck.mode === "fila" ? "La fila · " : "Sonando · "}
          {title}
        </p>
        <a href={open} target="_blank" rel="noopener noreferrer" aria-label="Abrir en la app de música" className="grid h-8 w-8 place-items-center rounded-full text-slate-300 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <button type="button" onClick={() => musicDeck.set({ folded: !deck.folded })} aria-label={deck.folded ? "Mostrar el reproductor" : "Recoger el reproductor"} aria-expanded={!deck.folded} className="grid h-8 w-8 place-items-center rounded-full text-slate-300 hover:text-white">
          {deck.folded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        <button type="button" onClick={() => musicDeck.stop()} aria-label="Apagar la música" className="grid h-8 w-8 place-items-center rounded-full text-slate-300 hover:text-white">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {/* Recogido sigue montado (y sonando): solo se esconde */}
      <div className={deck.folded ? "pointer-events-none h-0 overflow-hidden opacity-0" : "px-3 pb-3"}>
        {deck.mode === "fila" ? (
          item ? (
            <>
              <YouTubeQueuePlayer
                key={item.r.id}
                embed={item.link!.embedUrl!}
                title={item.r.text}
                onEnd={next}
                onError={() => {
                  setSkipped(item.r.text);
                  next();
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  <ListMusic className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  {playable.length - 1 > 0 ? `${playable.length - 1} más en la fila` : "Último de la fila"}
                </span>
                <button type="button" onClick={next} className="chip !min-h-[30px]">
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-white/[0.04] p-3 text-sm text-slate-300">La fila está vacía: pega un link de YouTube en la pista y suena aquí.</p>
          )
        ) : (
          <MusicEmbed np={np} size="mini" />
        )}
        {skipped && deck.mode === "fila" && <p className="mt-2 text-xs text-amber-100/90">«{skipped}» no se deja reproducir fuera de YouTube: pasamos al siguiente.</p>}
      </div>
    </aside>
  );
}
