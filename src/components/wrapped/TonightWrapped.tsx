"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { buildWrapped, drawWrapped } from "@/lib/wrapped";
import { useLocale } from "@/lib/useLocale";
import { audioEffects } from "@/lib/audioEffects";
import { fireConfetti } from "@/lib/confetti";

/** Resumen de la noche con premios automáticos y tarjeta descargable para historias. */
export default function TonightWrapped({ store }: { store: CarreteStore }) {
  const { locale } = useLocale();
  const data = useMemo(() => buildWrapped(store.state), [store.state]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

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
      else await navigator.share({ title: "Tonight Wrapped", text: `Nuestro ${locale.terminology.partyName.toLowerCase()}: ${data.drinks} tragos, ${data.waterLiters.toFixed(1)} L de agua y ${data.rounds} rondas.` });
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
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <p className="eyebrow">Tonight Wrapped</p>
        <h2 className="display text-display-lg mt-2">
          Qué noche<span className="text-gradient-ember">.</span>
        </h2>
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className={`font-display text-5xl font-extrabold tabular ${s.water ? "text-cyan-300" : "text-white"}`}>{s.n}</dd>
              <dt className="mt-1 text-sm text-slate-400">{s.label}</dt>
            </div>
          ))}
        </dl>

        <p className="eyebrow mt-12">Premios de la noche</p>
        {data.awards.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Registren tragos, agua y jueguen algunas rondas: los premios aparecen solos.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.awards.map((a) => (
              <li key={a.title} className="surface flex gap-4 p-4">
                <span className="text-4xl">{a.emoji}</span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{a.title}</span>
                  <span className="block font-display text-xl font-bold text-white">{a.who}</span>
                  <span className="block text-xs text-slate-400">{a.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="space-y-3 lg:pt-24">
        <div className="surface p-5">
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
