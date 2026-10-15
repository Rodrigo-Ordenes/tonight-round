"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Link2, Sparkles, Wand2 } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import { nightMoment } from "@/lib/nightMoment";
import {
  appleMusicSearch,
  djSuggestions,
  openForVibe,
  resolveNowPlaying,
  roomPulse,
  spotifyEmbedFromUrl,
  vibesFor,
  youtubeMusicSearch,
} from "@/lib/music";
import { audioEffects } from "@/lib/audioEffects";

function EnergyMeter({ value }: { value: number }) {
  return (
    <span className="flex items-end gap-[3px]" aria-label={`Energía ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-[4px] rounded-full ${i <= value ? "bg-emerald-400" : "bg-white/10"}`} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  );
}

export default function MusicaPage() {
  const { code, hydrated } = useActiveCode();
  const { country, locale } = useLocale();
  const store = useCarreteStore(code);
  const { state, dispatch, isSolo } = store;
  const [now, setNow] = useState<Date | null>(null);
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  const vibes = useMemo(() => vibesFor(country), [country]);
  const ctx = useMemo(() => (now ? { country, now, state } : null), [country, now, state]);
  const picks = useMemo(() => (ctx ? djSuggestions(ctx).slice(0, 3) : []), [ctx]);

  if (!hydrated || !now || !ctx) return <div className="min-h-[50dvh]" />;

  const music = state.music;
  const np = resolveNowPlaying(music, ctx);
  const moment = nightMoment(now);
  const pulse = roomPulse(state, now.getTime());
  const auto = music?.auto ?? true;

  const choose = (vibeId: string) => {
    audioEffects.playPop();
    dispatch({ type: "SET_MUSIC", patch: { vibeId, auto: false, setBy: store.meId ?? undefined } });
  };

  const setAuto = () => {
    audioEffects.playReveal();
    dispatch({ type: "SET_MUSIC", patch: { auto: true } });
  };

  const applyCustom = () => {
    const embed = spotifyEmbedFromUrl(custom);
    if (!embed) {
      setCustomError("Pega un link de Spotify (playlist, álbum, canción o artista).");
      return;
    }
    setCustomError(null);
    audioEffects.playSuccessChime();
    dispatch({ type: "SET_MUSIC", patch: { vibeId: "custom", customUrl: custom.trim(), auto: false } });
    setCustom("");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Cabecera editorial */}
      <header className="max-w-3xl">
        <p className="eyebrow">{moment.eyebrow}</p>
        <h1 className="display text-display-lg mt-3">
          DJ del {locale.terminology.partyName.toLowerCase()}<span className="text-gradient-ember">.</span>
        </h1>
        <p className="mt-3 text-base text-slate-300">
          {isSolo
            ? "Elige el ambiente o deja que el DJ lo cambie solo según la hora."
            : `Lo que elijas suena en la TV y en todos los celulares de la sala ${code}.`}{" "}
          El DJ automático lee la hora, tu país y el ritmo de la sala ({pulse.toFixed(1)} tragos por persona en la última hora).
        </p>
      </header>

      {/* Reproductor principal */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="surface overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`chip ${auto ? "chip-on" : ""}`}>
              {auto ? <Sparkles className="w-3.5 h-3.5" /> : null}
              {np.reason ?? "Sonando"}
            </span>
            <a href={np.open} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white">
              Abrir en Spotify <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <iframe
            key={np.embed}
            title={`Spotify: ${np.title}`}
            src={np.embed}
            width="100%"
            height="380"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block rounded-2xl border-0"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="chip" href={youtubeMusicSearch(np.title)} target="_blank" rel="noopener noreferrer">
              YouTube Music <ExternalLink className="w-3 h-3" />
            </a>
            <a className="chip" href={appleMusicSearch(np.title)} target="_blank" rel="noopener noreferrer">
              Apple Music <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* El DJ sugiere */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">El DJ sugiere ahora</p>
            {!auto && (
              <button type="button" onClick={setAuto} className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200">
                <Wand2 className="w-3.5 h-3.5" /> Volver al DJ automático
              </button>
            )}
          </div>
          {picks.map(({ vibe, reason }, i) => (
            <button
              key={vibe.id}
              type="button"
              onClick={() => choose(vibe.id)}
              className={`surface surface-hover relative flex w-full items-center gap-4 overflow-hidden p-4 text-left`}
            >
              <span className={`absolute inset-0 bg-gradient-to-br ${vibe.gradient} opacity-60`} aria-hidden />
              <span className="relative font-mono text-xs text-slate-400">0{i + 1}</span>
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

          <div className="surface p-4">
            <p className="eyebrow flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Tu propia playlist
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                placeholder="https://open.spotify.com/playlist/…"
                aria-label="Link de Spotify"
                className="min-h-[46px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
              />
              <button type="button" onClick={applyCustom} className="btn-primary !px-4">
                Poner
              </button>
            </div>
            {customError && <p className="mt-2 text-xs text-rose-300">{customError}</p>}
          </div>
        </div>
      </section>

      {/* Pedidos de la sala */}
      {(music?.requests ?? []).length > 0 && (
        <section>
          <p className="eyebrow mb-4">Pedidos de la sala</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(music?.requests ?? [])
              .slice()
              .reverse()
              .map((r) => (
                <li key={r.id} className={`surface flex items-center gap-3 p-3 ${r.played ? "opacity-50" : ""}`}>
                  <span className="text-xl">🎵</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white">{r.text}</span>
                    <span className="block text-xs text-slate-400">pedida por {state.participants.find((p) => p.id === r.by)?.name ?? "alguien"}</span>
                  </span>
                  <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(r.text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip !min-h-[32px]"
                  >
                    Buscar
                  </a>
                  {!r.played && (
                    <button type="button" onClick={() => dispatch({ type: "SONG_PLAYED", id: r.id })} className="chip !min-h-[32px]">
                      Sonó ✓
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Todos los ambientes */}
      <section>
        <p className="eyebrow mb-4">Todos los ambientes</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {vibes.map((vibe) => {
            const active = !auto && music?.vibeId === vibe.id;
            return (
              <div key={vibe.id} className={`surface relative overflow-hidden ${active ? "ring-2 ring-indigo-400" : ""}`}>
                <span className={`absolute inset-0 bg-gradient-to-br ${vibe.gradient} opacity-40`} aria-hidden />
                <button type="button" onClick={() => choose(vibe.id)} className="relative block w-full p-4 text-left">
                  <span className="flex items-start justify-between">
                    <span className="text-3xl">{vibe.emoji}</span>
                    <EnergyMeter value={vibe.energy} />
                  </span>
                  <span className="mt-4 block font-display text-base font-bold leading-tight text-white">{vibe.name}</span>
                  <span className="mt-1 block text-xs text-slate-300">{vibe.blurb}</span>
                </button>
                <a
                  href={openForVibe(vibe)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-1 px-4 pb-3 text-[11px] font-semibold text-slate-400 hover:text-white"
                >
                  Spotify <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
