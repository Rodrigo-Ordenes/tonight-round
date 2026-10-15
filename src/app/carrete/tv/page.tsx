"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore, SOLO } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import { bacFor, hydrationFor } from "@/lib/alcohol";
import { LIVE_GAME_BY_ID } from "@/lib/liveGames";
import { resolveNowPlaying } from "@/lib/music";
import { nightMoment } from "@/lib/nightMoment";
import { audioEffects } from "@/lib/audioEffects";
import { fireConfetti } from "@/lib/confetti";
import RoundResults from "@/components/live/RoundResults";

export default function CarreteTVPage() {
  return (
    <Suspense fallback={null}>
      <TvStage />
    </Suspense>
  );
}

/** Smart TV: escenario a 3 metros. Lobby con QR y ranking; las rondas en vivo toman la pantalla completa. */
function TvStage() {
  const params = useSearchParams();
  const { code: activeCode, hydrated } = useActiveCode();
  const code = (params.get("code") ?? activeCode).toUpperCase();
  const store = useCarreteStore(code);
  const { locale, country } = useLocale();
  const [qr, setQr] = useState("");
  const [full, setFull] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [origin, setOrigin] = useState("");
  const revealed = useRef<string | null>(null);

  const valid = code !== SOLO && code.length === 4;
  const round = store.state.live?.round ?? null;

  useEffect(() => {
    setOrigin(window.location.host);
    const iv = setInterval(() => setNow(Date.now()), 15000);
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      clearInterval(iv);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    if (!valid) return;
    QRCode.toDataURL(`${window.location.origin}/carrete/${code}?modo=celular`, { width: 520, margin: 1, color: { dark: "#07060A", light: "#F7F5F3" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code, valid]);

  useEffect(() => {
    if (round?.revealedAt && revealed.current !== round.id) {
      revealed.current = round.id;
      audioEffects.playReveal();
      void fireConfetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, colors: ["#FF5E36", "#9C82FF", "#86E64C", "#3EE0FF"] });
    }
  }, [round?.revealedAt, round?.id]);

  const rows = useMemo(
    () => store.participants.map((p) => ({ p, r: bacFor(p, now), h: hydrationFor(p) })).sort((a, b) => b.r.totalGrams - a.r.totalGrams),
    [store.participants, now]
  );

  const toggleFull = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => undefined);
    else void document.exitFullscreen?.().catch(() => undefined);
  };

  if (!hydrated || (valid && store.status === "loading")) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-tv-sm text-slate-400">Conectando con la sala…</div>;
  }

  if (!valid || store.status === "missing") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-10 text-center">
        <p className="display text-tv-lg">La TV necesita una sala</p>
        <p className="max-w-2xl text-tv-sm text-slate-300">Crea o entra a un {locale.terminology.partyName.toLowerCase()} desde el celular o el computador y vuelve a abrir el Modo TV.</p>
        <Link href="/" className="btn-primary !min-h-[64px] !px-8 text-xl">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const music = resolveNowPlaying(store.state.music, { country, now: new Date(now), state: store.state });
  const moment = nightMoment(new Date(now));
  const voters = round ? Object.keys(round.votes) : [];

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-[4vw] py-[3vh]">
      {/* Barra superior */}
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="font-display text-tv-sm font-extrabold tracking-[0.2em] text-white">TONIGHT</span>
          <span className="eyebrow !text-base">{moment.eyebrow}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2">
            <span className="live-dot" />
            <span className="font-mono text-tv-sm font-bold tracking-[0.25em] text-white">{code}</span>
          </span>
          <button type="button" onClick={toggleFull} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white" aria-label="Pantalla completa">
            {full ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
          <Link href={`/carrete/${code}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white" aria-label="Volver a la sala">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {round ? (
        /* ---------------- Ronda en vivo ---------------- */
        <main className="flex flex-1 flex-col justify-center py-[4vh]" aria-live="polite">
          <p className="eyebrow !text-xl">
            {LIVE_GAME_BY_ID.get(round.game)?.emoji} {LIVE_GAME_BY_ID.get(round.game)?.name}
          </p>
          {!round.revealedAt ? (
            <>
              <h1 className="display text-tv-hero mt-6 max-w-[85vw] animate-rise-in">
                {round.game === "confesion" ? `"${round.prompt}"` : round.game === "impostor" ? "¿Quién es el impostor?" : round.prompt}
              </h1>
              {round.game === "prefieres" && (
                <div className="mt-10 grid max-w-[85vw] grid-cols-2 gap-8">
                  {round.options.map((o, i) => (
                    <p key={o.id} className={`rounded-[2rem] border border-white/10 p-8 text-tv-md font-bold text-white ${i === 0 ? "bg-indigo-500/15" : "bg-purple-500/15"}`}>
                      {o.label}
                    </p>
                  ))}
                </div>
              )}
              {round.game === "impostor" && <p className="mt-6 max-w-[80vw] text-tv-sm text-slate-300">{round.prompt}</p>}
              <div className="mt-12">
                <p className="text-tv-sm text-slate-300">
                  Votaron <span className="font-mono font-bold text-white">{voters.length}</span> de {store.participants.length} · voten desde el celular
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {store.participants.map((p) => (
                    <span
                      key={p.id}
                      className={`rounded-full px-5 py-2 text-xl font-semibold transition-colors ${voters.includes(p.id) ? "bg-emerald-400 text-night-950" : "bg-white/[0.05] text-slate-400"}`}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 max-w-[85vw]">
              {round.game !== "prefieres" && round.game !== "impostor" && (
                <p className="mb-6 text-tv-sm text-slate-400">{round.game === "confesion" ? `"${round.prompt}"` : round.prompt}</p>
              )}
              <RoundResults round={round} participants={store.participants} size="tv" />
            </div>
          )}
        </main>
      ) : (
        /* ---------------- Lobby ---------------- */
        <main className="grid flex-1 grid-cols-1 items-center gap-[4vw] py-[4vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <section>
            <h1 className="display text-tv-hero">
              Escanea
              <br />y <span className="text-gradient-ember">juega.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-tv-sm text-slate-300">
              Apunta la cámara al código. Tu celular se vuelve tu control: votos secretos, tragos, agua y confesiones. O entra a{" "}
              <span className="font-mono text-white">{origin}</span> con el código <span className="font-mono font-bold text-white">{code}</span>.
            </p>
            <div className="mt-10 flex items-center gap-8">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR para unirse a la sala ${code}`} className="h-[min(26vh,280px)] w-[min(26vh,280px)] rounded-[2rem]" />
              ) : (
                <div className="h-[min(26vh,280px)] w-[min(26vh,280px)] animate-pulse rounded-[2rem] bg-white/[0.05]" />
              )}
              <div className="space-y-3">
                <p className="eyebrow !text-base">Sonando</p>
                <p className="font-display text-tv-md font-bold text-white">
                  {music.vibe?.emoji} {music.title}
                </p>
                <p className="text-xl text-slate-400">{music.reason}</p>
              </div>
            </div>
          </section>

          <section aria-label="Monstruómetro" className="space-y-3">
            <p className="eyebrow !text-lg">Monstruómetro</p>
            {rows.length === 0 && <p className="text-tv-sm text-slate-400">Esperando a los primeros…</p>}
            {rows.slice(0, 8).map(({ p, r, h }, i) => {
              const driver = p.role === "driver";
              const pct = Math.min(100, (r.bac / 1.2) * 100);
              const tone = driver ? (r.totalGrams > 0 ? "bg-rose-500" : "bg-amber-400") : r.bac >= 0.8 ? "bg-rose-500" : r.bac >= 0.3 ? "bg-amber-400" : "bg-emerald-400";
              return (
                <div key={p.id} className="rounded-3xl bg-white/[0.04] px-6 py-4">
                  <div className="flex items-center gap-4 text-tv-sm">
                    <span className="w-10 font-mono text-slate-500">{driver ? "👑" : String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 truncate font-bold text-white">{p.name}</span>
                    {p.waterCount > 0 && <span className="text-cyan-200">💧{p.waterCount}</span>}
                    {h.needsWater && p.consumptions.length > 0 && <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-lg text-cyan-100">¡agua!</span>}
                    <span className="font-mono tabular text-slate-200">{r.bac.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${tone} transition-[width] duration-1000`} style={{ width: `${driver ? 100 : Math.max(2, pct)}%`, opacity: driver && r.totalGrams === 0 ? 0.4 : 1 }} />
                  </div>
                </div>
              );
            })}
            <p className="pt-2 text-lg text-slate-500">
              Estimación educativa. {locale.legal.bacLimitText}: si bebiste, no manejes.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}
