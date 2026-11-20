"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Award as AwardIcon, Disc3, Download, GlassWater, Lock, RotateCw, Share2, Smartphone, Sparkles } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { buildWrapped, drawWrapped, type Award } from "@/lib/wrapped";
import { useLocale } from "@/lib/useLocale";
import { audioEffects } from "@/lib/audioEffects";
import { fireConfetti } from "@/lib/confetti";
import CountUp from "@/components/ui/CountUp";
import IridescentFoil, { orientationNeedsPermission, requestOrientation } from "@/components/ui/iridescent-foil";

/** Premios ya revelados en esta sala: se recuerdan mientras dure la pestaña (volver al resumen no los tapa de nuevo) */
const revealKey = (code: string) => `tonight_wrapped_revealed_${code}`;
const FACE = "holo-face rounded-3xl border border-white/15 bg-night-950";

/**
 * Resumen de la noche:
 * 1. Números del grupo, el trago y la canción de la noche.
 * 2. Premios de la noche como cartas boca abajo que se voltean en 3D al tocarlas (o todas juntas, con confeti).
 * 3. La tarjeta 9:16 en vivo: una carta holográfica de dos caras (21st «Iridescent Foil») que brilla con el puntero, el
 *    scroll o la inclinación del teléfono, con planos que se separan en profundidad. Se voltea para ver el cuadro de
 *    honor.
 * 4. La imagen 1080×1920 para historias.
 * Las cifras no se animan dentro de la tarjeta: lo que se mueve es la carta, no los números.
 */
export default function TonightWrapped({ store }: { store: CarreteStore }) {
  const { locale } = useLocale();
  const data = useMemo(() => buildWrapped(store.state), [store.state]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [cascade, setCascade] = useState(false);
  const [announce, setAnnounce] = useState("");
  // Inclinación del teléfono: Android la da sin preguntar; en iPhone se pide con un toque
  const [tiltAsk, setTiltAsk] = useState(false);
  const [tiltOn, setTiltOn] = useState(false);

  useEffect(() => {
    setCanShare("share" in navigator);
    const needs = orientationNeedsPermission();
    setTiltAsk(needs);
    setTiltOn(!needs && typeof DeviceOrientationEvent !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(revealKey(data.code)) ?? "[]");
      if (Array.isArray(saved)) setRevealed(new Set(saved.filter((t): t is string => typeof t === "string")));
    } catch {
      /* sin almacenamiento: los premios empiezan boca abajo */
    }
  }, [data.code]);

  const persist = (next: Set<string>) => {
    try {
      sessionStorage.setItem(revealKey(data.code), JSON.stringify([...next]));
    } catch {
      /* sin almacenamiento */
    }
  };

  const reveal = (a: Award) => {
    if (revealed.has(a.title)) return;
    const next = new Set(revealed).add(a.title);
    setCascade(false);
    setRevealed(next);
    persist(next);
    setAnnounce(`${a.title}: ${a.who}`);
    audioEffects.playPop();
    if (data.awards.every((x) => next.has(x.title))) void fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.7 } });
  };

  const revealAll = () => {
    const next = new Set(data.awards.map((a) => a.title));
    setCascade(true);
    setRevealed(next);
    persist(next);
    setAnnounce("Todos los premios a la vista");
    audioEffects.playReveal();
    void fireConfetti({ particleCount: 110, spread: 90, origin: { y: 0.7 } });
  };

  const askTilt = async () => {
    const ok = await requestOrientation();
    setTiltOn(ok);
    setTiltAsk(!ok);
  };

  const render = async (): Promise<Blob | null> => {
    const c = canvasRef.current ?? document.createElement("canvas");
    await drawWrapped(c, data, locale.terminology.partyName);
    return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
  };

  const download = async () => {
    setBusy(true);
    audioEffects.playReveal();
    void fireConfetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    const blob = await render();
    setBusy(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tonight-wrapped-${data.code}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const share = async () => {
    setBusy(true);
    const blob = await render();
    setBusy(false);
    if (!blob) return;
    const file = new File([blob], `tonight-wrapped-${data.code}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Tonight Wrapped" });
      else
        await navigator.share({
          title: "Tonight Wrapped",
          text: `Nuestro ${locale.terminology.partyName.toLowerCase()}: ${data.drinks} tragos, ${data.waterLiters.toFixed(1)} L de agua y ${data.rounds} rondas.`,
        });
    } catch {
      /* cancelado */
    }
  };

  const stats = [
    { n: data.people, label: "personas" },
    { n: data.drinks, label: "tragos" },
    { n: `${data.waterLiters.toFixed(1)} L`, label: "de agua", water: true },
    { n: data.rounds, label: "rondas jugadas" },
    { n: data.distinctDrinks, label: "tragos distintos" },
    { n: data.hours > 0 ? `${data.hours.toFixed(1)} h` : "—", label: "de carrete" },
    { n: `${data.hydrationPct}%`, label: "de hidratación del grupo", water: true, bar: true },
  ];
  const pending = data.awards.filter((a) => !revealed.has(a.title)).length;
  const party = locale.terminology.partyName.toLowerCase();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section>
        <p className="eyebrow">Tonight Wrapped · sala {data.code}</p>
        <h2 className="display mt-1 text-display-lg">
          Qué noche<span className="text-accent">.</span>
        </h2>
        <p className="meta mt-2">El resumen del grupo y los premios que dejó la mesa.</p>

        <dl className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="surface relative overflow-hidden p-4">
              <dd className={`font-display text-4xl font-extrabold tabular sm:text-5xl ${s.water ? "text-cyan-300" : "text-white"}`}>{typeof s.n === "number" ? <CountUp value={s.n} /> : s.n}</dd>
              <dt className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">{s.label}</dt>
              {s.bar && (
                <div aria-hidden className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full origin-left rounded-full bg-emerald-400" style={{ transform: `scaleX(${Math.max(0.04, data.hydrationPct / 100)})` }} />
                </div>
              )}
            </div>
          ))}
        </dl>

        {(data.topSong || data.topDrink) && (
          <dl className="mt-6 grid gap-3.5 sm:grid-cols-2">
            {data.topDrink && (
              <div className="surface flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-200" aria-hidden>
                  <GlassWater className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <dt className="eyebrow">Trago de la noche</dt>
                  <dd className="mt-0.5 truncate font-display text-2xl font-extrabold text-white">{data.topDrink}</dd>
                </div>
              </div>
            )}
            {data.topSong && (
              <div className="surface flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-400/30 bg-purple-500/10 text-purple-200" aria-hidden>
                  <Disc3 className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <dt className="eyebrow">Canción más pedida</dt>
                  <dd className="mt-0.5 truncate font-display text-2xl font-extrabold text-white">{data.topSong}</dd>
                </div>
              </div>
            )}
          </dl>
        )}

        {/* Premios de la noche: cartas boca abajo que se voltean (ceremonia de cierre) */}
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Premios de la noche</h3>
            {data.awards.length > 0 && <p className="mt-0.5 text-xs text-slate-400">{pending > 0 ? "Toquen cada carta para revelar quién se lo llevó." : "Todos a la vista. Así quedó la mesa."}</p>}
          </div>
          {data.awards.length > 0 && (
            <button type="button" onClick={pending > 0 ? revealAll : () => void fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.7 } })} className="chip">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" aria-hidden /> {pending > 0 ? `Revelar todos (${pending})` : "Celebrar otra vez"}
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {data.awards.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Registren tragos, agua y jueguen algunas rondas: los premios aparecen solos.</p>
        ) : (
          <ul className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {data.awards.map((a, i) => {
              const open = revealed.has(a.title);
              return (
                <li key={a.title} className="[perspective:900px]">
                  <button
                    type="button"
                    onClick={() => reveal(a)}
                    data-open={open}
                    aria-label={open ? `${a.title}: ${a.who}. ${a.detail}` : `Revelar el premio «${a.title}»`}
                    style={{ "--delay": cascade ? `${i * 110}ms` : "0ms" } as React.CSSProperties}
                    className="award-flip min-h-[7.5rem] rounded-2xl text-left"
                  >
                    <span aria-hidden className="award-face award-front flex h-full items-center gap-4 rounded-2xl border border-dashed border-indigo-400/40 bg-night-900 p-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-night-950 font-led text-2xl text-indigo-200">?</span>
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-bold text-slate-400">Premio {String(i + 1).padStart(2, "0")}</span>
                        <span className="mt-0.5 block font-display text-lg font-bold leading-tight text-white">{a.title}</span>
                        <span className="mt-1 block text-xs font-semibold text-indigo-200">Toca para revelar</span>
                      </span>
                    </span>
                    <span aria-hidden className="award-face award-back relative flex h-full items-start gap-4 overflow-hidden rounded-2xl border border-indigo-400/35 bg-night-900 p-4">
                      <span className="award-sheen pointer-events-none absolute inset-0" />
                      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-night-950/80 text-3xl">{a.emoji}</span>
                      <span className="relative min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-indigo-200">{a.title}</span>
                          <span className="font-mono text-xs font-bold text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                        </span>
                        <span className="mt-0.5 block truncate font-display text-xl font-bold text-white">{a.who}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-300">{a.detail}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="space-y-4">
        {/* La tarjeta en vivo: carta holográfica de dos caras */}
        <div className="mx-auto w-full max-w-[340px]">
          <div className="[perspective:1400px]">
            <div className="holo-flip aspect-[9/16] w-full" data-flipped={flipped}>
              <IridescentFoil className={`${FACE} holo-front`} tilt={8} active={!flipped} motion={tiltOn} aria-hidden={flipped}>
                <div className="flex h-full flex-col justify-between p-6">
                  <div data-foil-depth="6" className="flex items-center justify-between gap-2 font-mono text-xs font-bold">
                    <span className="tracking-[0.16em] text-indigo-200">TONIGHT · {data.code}</span>
                    <span className="text-slate-400">Wrapped</span>
                  </div>
                  <div data-foil-depth="18">
                    <p className="font-display text-5xl font-extrabold leading-[0.92] text-white">
                      Qué
                      <br />
                      noche<span className="text-accent">.</span>
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-300">
                      {data.people} {data.people === 1 ? "persona" : "personas"} · {data.hours > 0 ? `${data.hours.toFixed(1)} h de ${party}` : "en vivo"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 border-y border-white/10">
                    {[
                      { n: data.drinks, label: "tragos" },
                      { n: `${data.waterLiters.toFixed(1)} L`, label: "de agua", water: true },
                      { n: data.rounds, label: "rondas" },
                      { n: data.distinctDrinks, label: "recetas" },
                    ].map((s, i) => (
                      <div key={s.label} className={`py-3 ${i % 2 ? "border-l border-white/10 pl-4" : "pr-4"} ${i > 1 ? "border-t border-white/10" : ""}`}>
                        <p className={`font-display text-3xl font-extrabold tabular ${s.water ? "text-cyan-300" : "text-white"}`}>{s.n}</p>
                        <p className="text-xs font-semibold text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div data-foil-depth="10" className="space-y-1 text-xs text-slate-300">
                    {data.topDrink && (
                      <p className="truncate">
                        <span className="font-bold text-white">Trago:</span> {data.topDrink}
                      </p>
                    )}
                    {data.topSong && (
                      <p className="truncate">
                        <span className="font-bold text-white">Canción:</span> {data.topSong}
                      </p>
                    )}
                    <p className="pt-2 font-display font-bold text-indigo-300">El {party} se armó en Tonight</p>
                  </div>
                </div>
              </IridescentFoil>

              <IridescentFoil className={`${FACE} holo-back`} tilt={8} base="rotateY(180deg)" active={flipped} motion={tiltOn} aria-hidden={!flipped} layersKey={revealed.size}>
                <div className="flex h-full flex-col p-6">
                  <p data-foil-depth="6" className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-purple-300">
                    <AwardIcon className="h-3.5 w-3.5" aria-hidden /> CUADRO DE HONOR
                  </p>
                  <p data-foil-depth="16" className="mt-2 font-display text-3xl font-extrabold leading-tight text-white">
                    Los premios del grupo<span className="text-accent">.</span>
                  </p>
                  <ol className="mt-5 flex-1 divide-y divide-white/10 border-y border-white/10">
                    {data.awards.length === 0 && <li className="py-3 text-xs text-slate-300">Todavía no hay premios en esta sala.</li>}
                    {data.awards.slice(0, 6).map((a) => {
                      const open = revealed.has(a.title);
                      return (
                        <li key={a.title} className="flex items-center gap-3 py-2.5">
                          <span className="w-7 shrink-0 text-center text-xl" aria-hidden>
                            {open ? a.emoji : <Lock className="mx-auto h-4 w-4 text-slate-500" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs text-indigo-200">{a.title}</span>
                            <span className={`block truncate text-sm font-bold ${open ? "text-white" : "text-slate-500"}`}>{open ? a.who : "Por revelar"}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p data-foil-depth="8" className="pt-4 font-mono text-xs font-bold text-emerald-300">
                    EDICIÓN HOLOGRÁFICA · {data.code}
                  </p>
                </div>
              </IridescentFoil>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              aria-pressed={flipped}
              onClick={() => {
                audioEffects.playPop();
                setFlipped((f) => !f);
              }}
              className="chip"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden /> {flipped ? "Ver el frente" : "Voltear la tarjeta"}
            </button>
            {tiltAsk && !tiltOn && (
              <button type="button" onClick={() => void askTilt()} className="chip">
                <Smartphone className="h-3.5 w-3.5" aria-hidden /> Moverla con el teléfono
              </button>
            )}
          </div>
        </div>

        <div className="surface mx-auto w-full max-w-[340px] p-5">
          <p className="font-display text-lg font-bold text-white">Llévatelo a las historias</p>
          <p className="mt-1 text-sm text-slate-400">Tarjeta vertical 1080×1920 con los números y premios del grupo.</p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={download} disabled={busy} className="btn-primary">
              <Download className="w-4 h-4" /> Descargar imagen
            </button>
            {canShare && (
              <button type="button" onClick={share} disabled={busy} className="btn-ghost">
                <Share2 className="w-4 h-4" /> Compartir
              </button>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </aside>
    </div>
  );
}
