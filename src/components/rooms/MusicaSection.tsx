"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Heart, Link2, Pause, Play, Sparkles, Wand2 } from "lucide-react";
import SectionStage, { type StageOption } from "./SectionStage";
import RoomVideo from "./RoomVideo";
import { sfx } from "./sfx";
import VinylAlbumCard from "@/components/ui/vinyl-album-card";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import { nightMoment } from "@/lib/nightMoment";
import { djSuggestions, openForVibe, resolveNowPlaying, roomPulse, songQueue, vibesFor } from "@/lib/music";
import { parseMusicLink } from "@/lib/musicLink";
import { musicDeck, useMusicDeck } from "@/lib/musicDeck";

function EnergyMeter({ value }: { value: number }) {
  return (
    <span className="flex items-end gap-[3px]" aria-label={`Energía ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-[4px] rounded-full ${i <= value ? "bg-emerald-400" : "bg-white/10"}`} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Apartado Música: la pista del club. Gente bailando, focos y la cabina con sus tornamesas; el host te pasa el micrófono.
 * Solo: pones tu lista (Spotify o YouTube) y queda sonando como tu ambiente mientras recorres el club. En sala: lo que
 * se elige suena para todos y cualquiera suma canciones a la fila (links de YouTube que suenan en orden, con votos).
 */
export default function MusicaSection() {
  const { code, hydrated } = useActiveCode();
  const { country, locale } = useLocale();
  const store = useCarreteStore(code);
  const { state, dispatch, isSolo } = store;
  const deck = useMusicDeck();
  const [now, setNow] = useState<Date | null>(null);
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [song, setSong] = useState("");

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  const vibes = useMemo(() => vibesFor(country), [country]);
  const ctx = useMemo(() => (now ? { country, now, state } : null), [country, now, state]);
  const picks = useMemo(() => (ctx ? djSuggestions(ctx).slice(0, 3) : []), [ctx]);

  if (!hydrated || !now || !ctx) return <div className="min-h-[60dvh]" />;

  const music = state.music;
  const np = resolveNowPlaying(music, ctx);
  const moment = nightMoment(now);
  const pulse = roomPulse(state, now.getTime());
  const auto = music?.auto ?? true;
  const queue = songQueue(music);
  const played = (music?.requests ?? []).filter((r) => r.played);
  const sounding = deck.on;

  const choose = (vibeId: string) => {
    sfx.scratch();
    dispatch({ type: "SET_MUSIC", patch: { vibeId, auto: false, setBy: store.meId ?? undefined } });
    musicDeck.play("ambiente");
  };
  const setAuto = () => {
    sfx.scratch();
    dispatch({ type: "SET_MUSIC", patch: { auto: true } });
  };
  const applyCustom = () => {
    const link = parseMusicLink(custom);
    if (!link) {
      setCustomError("Pega un link de Spotify (playlist, álbum, canción, artista o Jam) o de YouTube (lista o video).");
      return;
    }
    setCustomError(null);
    sfx.scratch();
    dispatch({ type: "SET_MUSIC", patch: { vibeId: "custom", customUrl: link.openUrl, auto: false } });
    setCustom("");
    musicDeck.play("ambiente");
  };
  const addSong = () => {
    const t = song.trim();
    if (t.length < 2) return;
    // Un link se guarda limpio (sin rastreo) para que quepa y suene; un tema escrito queda para buscarlo
    const link = parseMusicLink(t);
    dispatch({ type: "SONG_REQUEST", request: { id: uid(), by: store.meId ?? "yo", text: (link ? link.openUrl : t).slice(0, 80), at: Date.now() } });
    sfx.clink();
    setSong("");
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const options: StageOption[] = [
    sounding
      ? { id: "pausa", label: "Apagar la música", hint: `Sonando: ${np.title}`, icon: <Pause className="h-5 w-5" />, onSelect: () => musicDeck.stop(), primary: true }
      : { id: "sonar", label: "Que suene aquí", hint: np.title, icon: <Play className="h-5 w-5" />, onSelect: () => musicDeck.play("ambiente"), primary: true },
    { id: "tu", label: isSolo ? "Pon tu música" : "Música de la sala", hint: "Tu lista de Spotify o YouTube", icon: "🎧", onSelect: () => scrollTo("tu-musica") },
    { id: "fila", label: "La fila", hint: isSolo ? "Tus videos de YouTube, en orden" : "Todos suman canciones", icon: "📼", onSelect: () => scrollTo("la-fila") },
    { id: "dj", label: "El DJ sugiere", hint: "Según la hora y el ritmo", icon: "🪩", onSelect: () => scrollTo("dj-sugiere") },
  ];
  const lines = isSolo
    ? ["La pista es tuya: pon tu lista y queda sonando mientras recorres el club.", "¿YouTube? Pega el link en la fila y suena en orden.", "¿No sabes qué poner? Yo leo la hora y te sugiero."]
    : [`Lo que elijas suena para toda la sala ${code}.`, "Cualquiera puede sumar canciones a la fila desde su celular.", `El DJ automático lee la hora y el ritmo de la sala (${pulse.toFixed(1)} tragos por persona en la última hora).`];

  return (
    <SectionStage id="musica" video="musica" eyebrow={moment.eyebrow} title="La pista" lines={lines} options={options} sound="scratch" active={sounding ? "pausa" : null}>
      <div className="space-y-12 pt-8 pb-12">
        {/* La cabina: lo que suena, las tornamesas y el DJ */}
        <section aria-labelledby="cabina-title" className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="surface relative overflow-hidden p-5 sm:p-6">
            <RoomVideo name="dj" veil="full" />
            <div className="relative">
              <p className="eyebrow flex items-center gap-1.5">
                {auto ? <Sparkles className="h-3.5 w-3.5" aria-hidden /> : null} {np.reason ?? "Sonando"}
              </p>
              <h2 id="cabina-title" className="display mt-2 text-3xl sm:text-4xl">
                {np.title}
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-6">
                <VinylAlbumCard title={np.title} artist={np.vibe?.name ?? (np.provider === "youtube" ? "YouTube" : "Spotify")} meta={np.reason ?? "Sonando"} mark={np.vibe?.emoji ?? "♪"} />
                <div className="flex flex-col gap-2">
                  {sounding ? (
                    <button type="button" onClick={() => musicDeck.stop()} className="btn-ghost !min-h-[46px]">
                      <Pause className="h-4 w-4" aria-hidden /> Apagar
                    </button>
                  ) : (
                    <button type="button" onClick={() => musicDeck.play("ambiente")} className="btn-primary !min-h-[46px]">
                      <Play className="h-4 w-4" aria-hidden /> Que suene aquí
                    </button>
                  )}
                  <a href={np.open} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white">
                    Abrir en {np.provider === "youtube" ? "YouTube" : "Spotify"} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  {!auto && (
                    <button type="button" onClick={setAuto} className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200">
                      <Wand2 className="h-3.5 w-3.5" aria-hidden /> Volver al DJ automático
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tu música: queda sonando como tu ambiente (o el de la sala) */}
          <div id="tu-musica" className="surface scroll-mt-24 p-5 sm:p-6">
            <p className="eyebrow flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" aria-hidden /> {isSolo ? "Tu música" : "La música de la sala"}
            </p>
            <h2 className="display mt-2 text-2xl">{isSolo ? "Pon tu lista y queda sonando" : "Lo que pongas suena para todos"}</h2>
            <div className="mt-4 flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                placeholder="Link de Spotify, Jam o YouTube"
                aria-label="Link de Spotify o YouTube"
                className="min-h-[46px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
              />
              <button type="button" onClick={applyCustom} className="btn-primary !px-4">
                Poner
              </button>
            </div>
            {customError && <p className="mt-2 text-xs text-rose-300">{customError}</p>}
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Queda sonando mientras recorres el club (el reproductor te acompaña abajo). Spotify sin sesión da adelantos de 30 segundos y, con cuenta
              gratis, puede tener anuncios. YouTube suena completo; si un video no se deja reproducir fuera de YouTube, se salta al siguiente.
            </p>
          </div>
        </section>

        {/* La fila: pedidos con votos; los links de YouTube suenan en orden */}
        <section id="la-fila" aria-labelledby="fila-title" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="fila-title" className="display text-2xl sm:text-3xl">
                La fila<span className="text-accent">.</span>
              </h2>
              <p className="meta mt-1">{isSolo ? "Tus videos de YouTube, uno tras otro." : "Cualquiera de la sala suma canciones; tocar el corazón sube un pedido."}</p>
            </div>
            <button type="button" onClick={() => musicDeck.play("fila")} disabled={queue.length === 0} className="btn-primary !min-h-[44px] disabled:opacity-50">
              <Play className="h-4 w-4" aria-hidden /> Reproducir la fila
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={song}
              onChange={(e) => setSong(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSong()}
              maxLength={280}
              placeholder="Pega un link de YouTube o escribe el tema"
              aria-label="Pedir una canción"
              className="min-h-[46px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
            />
            <button type="button" onClick={addSong} className="btn-ghost !min-h-[46px]">
              Sumar
            </button>
          </div>
          {queue.length + played.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2" aria-label="Pedidos de la fila">
              {[...queue, ...played].map((r) => {
                const link = parseMusicLink(r.text);
                const yt = link?.provider === "youtube";
                const mine = !!store.meId && (r.votes ?? []).includes(store.meId);
                return (
                  <li key={r.id} className={`surface flex items-center gap-3 p-3 ${r.played ? "opacity-50" : ""}`}>
                    <button
                      type="button"
                      disabled={!store.meId || r.played}
                      onClick={() => store.meId && dispatch({ type: "VOTE_SONG", id: r.id, participantId: store.meId })}
                      aria-pressed={mine}
                      aria-label={`Votar ${r.text}`}
                      className={`flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-xl text-sm font-bold ${mine ? "bg-indigo-500/20 text-indigo-100" : "bg-white/[0.04] text-slate-300"} disabled:opacity-50`}
                    >
                      <Heart className="h-4 w-4" aria-hidden /> {r.votes?.length ?? 0}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{yt ? "▶ Video de YouTube" : link ? "Link de Spotify" : r.text}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {link ? r.text : `pedida por ${state.participants.find((p) => p.id === r.by)?.name ?? "alguien"}`}
                      </span>
                    </span>
                    {!link && (
                      <a href={`https://open.spotify.com/search/${encodeURIComponent(r.text)}`} target="_blank" rel="noopener noreferrer" className="chip !min-h-[32px]">
                        Buscar
                      </a>
                    )}
                    {!r.played && (
                      <button type="button" onClick={() => dispatch({ type: "SONG_PLAYED", id: r.id })} className="chip !min-h-[32px]">
                        Sonó ✓
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="surface p-4 text-sm text-slate-400">La fila está vacía. {isSolo ? "Pega un link de YouTube y suena aquí." : "Desde su celular, cada uno puede pedir canciones."}</p>
          )}
        </section>

        {/* El DJ sugiere y todos los ambientes */}
        <section id="dj-sugiere" aria-labelledby="dj-title" className="scroll-mt-24 space-y-4">
          <h2 id="dj-title" className="display text-2xl sm:text-3xl">
            El DJ sugiere<span className="text-accent">.</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {picks.map(({ vibe, reason }) => (
              <button key={vibe.id} type="button" onClick={() => choose(vibe.id)} className="surface surface-hover relative flex items-center gap-4 overflow-hidden p-4 text-left">
                <span className={`absolute inset-0 ${vibe.tint}`} aria-hidden />
                <span className="relative text-3xl">{vibe.emoji}</span>
                <span className="relative min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold text-white">{vibe.name}</span>
                  <span className="block text-xs text-slate-300">{reason}</span>
                </span>
                <span className="relative">
                  <EnergyMeter value={vibe.energy} />
                </span>
              </button>
            ))}
          </div>
          <p className="eyebrow pt-4">Todos los ambientes</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {vibes.map((vibe) => {
              const on = !auto && music?.vibeId === vibe.id;
              return (
                <div key={vibe.id} className={`surface relative overflow-hidden ${on ? "ring-2 ring-indigo-400" : ""}`}>
                  <span className={`absolute inset-0 ${vibe.tint}`} aria-hidden />
                  <button type="button" onClick={() => choose(vibe.id)} className="relative block w-full p-4 text-left">
                    <span className="flex items-start justify-between">
                      <span className="text-3xl">{vibe.emoji}</span>
                      <EnergyMeter value={vibe.energy} />
                    </span>
                    <span className="mt-4 block font-display text-base font-bold leading-tight text-white">{vibe.name}</span>
                    <span className="mt-1 block text-xs text-slate-300">{vibe.blurb}</span>
                  </button>
                  <a href={openForVibe(vibe)} target="_blank" rel="noopener noreferrer" className="relative flex items-center gap-1 px-4 pb-3 text-xs font-semibold text-slate-400 hover:text-white">
                    Spotify <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">DJ del {locale.terminology.partyName.toLowerCase()} · ambientes con playlists oficiales de Spotify.</p>
        </section>
      </div>
    </SectionStage>
  );
}
