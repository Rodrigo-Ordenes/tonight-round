"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Disc3, Gamepad2, GlassWater, KeyRound, Receipt, ShoppingBasket, Sparkles } from "lucide-react";
import { FOTO_HOST, FOTOS_INTRO } from "@/data/fotosEscena";
import AmbientPhoto from "@/components/ui/AmbientPhoto";

/** La carta del host: los módulos de la noche, en orden */
const CARTA = [
  { href: "/armar", n: "01", title: "La previa", desc: "La lista de compras con precios reales por tienda.", icon: ShoppingBasket },
  { href: "/bar", n: "02", title: "El bar", desc: "Tu trago con la medida exacta, también sin alcohol.", icon: GlassWater },
  { href: "/juegos", n: "03", title: "Los juegos", desc: "La TV de escenario y los celulares votando.", icon: Gamepad2 },
  { href: "/musica", n: "04", title: "La música", desc: "Un DJ que lee la hora y el ritmo de la sala.", icon: Disc3 },
  { href: "/dividir", n: "05", title: "La cuenta", desc: "Cuentas claras: quien maneja no paga el alcohol.", icon: Receipt },
];

/** La ronda de la intro, servida en la barra frente al host */
const RONDA = ["piscola", "cerveza", "vino", "agua"] as const;

function saludo(hour: number) {
  if (hour >= 6 && hour < 13) return "Buenos días";
  if (hour >= 13 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * La bienvenida: después de la intro «La ronda», el host de Tonight recibe a quien llega como en un club de primer
 * nivel. A la izquierda, su saludo y la carta (los cinco módulos, armar la mesa o entrar con un código); a la
 * derecha, él, que invita hacia la carta desde detrás de la barra donde quedó servida la ronda. Fotos reales en
 * planos (barra, host, contrabarra) que se separan apenas al bajar; nada rebota. Con movimiento reducido, quieto.
 */
export default function HostWelcome({ onCreate, onCode, busy }: { onCreate: () => void; onCode: () => void; busy: boolean }) {
  // El saludo depende de la hora del visitante (en el servidor no se conoce): se resuelve al montar
  const [greet, setGreet] = useState("Buenas noches");
  useEffect(() => setGreet(saludo(new Date().getHours())), []);
  const words = `${greet}. Qué gusto tenerte acá.`.split(" ");

  // Profundidad con el puntero (solo puntero fino): los platos de la carta se mueven según su distancia y el host al
  // revés, como una cámara entre planos. Transform directo en cada capa, un cuadro por movimiento.
  const scene = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = scene.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-carta-depth]"));
    const host = el.querySelector<HTMLElement>("[data-host-depth]");
    let frame = 0;
    let nx = 0;
    let ny = 0;
    const paint = () => {
      frame = 0;
      for (const it of items) {
        const d = Number(it.dataset.cartaDepth ?? 1);
        it.style.transform = `translate3d(${(nx * d * 12).toFixed(1)}px, ${(ny * d * 7).toFixed(1)}px, 0)`;
      }
      if (host) host.style.transform = `translate3d(${(-nx * 18).toFixed(1)}px, ${(-ny * 10).toFixed(1)}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width - 0.5;
      ny = (e.clientY - r.top) / r.height - 0.5;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={scene} aria-labelledby="host-title" className="host-scene relative isolate overflow-hidden rounded-3xl border border-white/10 bg-night-950">
      {/* El club de fondo (foto real) y, encima, luces del bar fuera de foco */}
      <AmbientPhoto name="club" className="inset-0" />
      <div aria-hidden className="parallax-deep pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_78%_35%,rgba(185,62,243,0.22),transparent_70%),radial-gradient(45%_40%_at_95%_80%,rgba(103,170,255,0.18),transparent_70%),radial-gradient(40%_35%_at_10%_10%,rgba(103,170,255,0.08),transparent_70%)]" />
        {[
          ["58%", "12%", 140, "rgba(103,170,255,0.28)"],
          ["86%", "6%", 90, "rgba(185,62,243,0.32)"],
          ["70%", "52%", 120, "rgba(140,227,190,0.14)"],
          ["94%", "40%", 70, "rgba(228,184,83,0.16)"],
        ].map(([left, top, size, color]) => (
          <span key={`${left}-${top}`} className="absolute rounded-full" style={{ left: left as string, top: top as string, width: size as number, height: size as number, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
        ))}
      </div>

      <div className="grid min-h-[min(100svh,58rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        {/* Saludo y carta */}
        <div className="relative z-10 flex flex-col justify-center gap-8 p-6 pb-10 sm:p-10 lg:p-14">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" aria-hidden /> Tonight · tu host esta noche
            </p>
            <h1 id="host-title" className="display mt-3 text-display-lg" aria-label={`${greet}. Qué gusto tenerte acá.`}>
              {words.map((w, i) => (
                <React.Fragment key={i}>
                <span aria-hidden className="word-mask">
                  <span className="word-in" style={{ animationDelay: `${120 + i * 80}ms` }}>
                    {i === words.length - 1 ? (
                      <>
                        {w.slice(0, -1)}
                        <span className="text-accent">.</span>
                      </>
                    ) : (
                      w
                    )}
                  </span>
                </span>{" "}
                </React.Fragment>
              ))}
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-300">Pasa, la barra está lista. ¿Qué hacemos hoy?</p>
          </div>

          {/* La carta: cada módulo como un plato de la casa */}
          <nav aria-label="La carta de la noche">
            <ol className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {CARTA.map((m, i) => (
                <li key={m.href} className="carta-float" style={{ "--d": (0.6 + i * 0.45).toFixed(2) } as React.CSSProperties}>
                  <Link href={m.href} data-carta-depth={(0.6 + i * 0.45).toFixed(2)} className="carta-tilt host-item group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 py-3.5">
                    <span className="font-led text-sm tracking-[0.12em] text-slate-500 transition-colors group-hover:text-indigo-200">{m.n}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
                        <m.icon className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden /> {m.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-400">{m.desc}</span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-slate-500 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onCreate} disabled={busy} className="btn-primary !min-h-[48px] px-6">
              Armar la mesa
            </button>
            <button type="button" onClick={onCode} className="btn-ghost !min-h-[48px]">
              <KeyRound className="h-4 w-4" aria-hidden /> Tengo un código
            </button>
            <Link href="/bar" className="text-sm font-semibold text-emerald-200 underline-offset-4 hover:underline">
              ¿Te toca manejar? Te preparo algo sin alcohol
            </Link>
          </div>
        </div>

        {/* El host detrás de la barra, invitando hacia la carta */}
        <div aria-hidden className="relative min-h-[26rem] lg:min-h-0">
          {FOTO_HOST && (
            // El plano medio se separa con el scroll; la foto entra una vez, sin rebote
            <div className="parallax-mid absolute inset-0">
              <div data-host-depth className="carta-tilt absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FOTO_HOST.src}
                alt=""
                width={FOTO_HOST.w}
                height={FOTO_HOST.h}
                decoding="async"
                className="host-photo absolute bottom-[3.25rem] right-[4%] h-[92%] w-auto max-w-none select-none object-contain sm:right-[10%] lg:bottom-[4.5rem]"
              />
              </div>
            </div>
          )}
          {/* La barra: madera oscura con filo de luz, y la ronda servida */}
          <div className="parallax-near absolute inset-x-0 bottom-0 h-[4.5rem] lg:h-[5.5rem]">
            <div className="absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(180deg,#23232A_0%,#131318_38%,#090A0D_100%)] shadow-[0_-18px_40px_-10px_rgba(0,0,0,0.85)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(137,189,255,0.7),rgba(185,62,243,0.6),transparent)]" />
            <div className="absolute bottom-[38%] left-1/2 flex -translate-x-1/2 items-end gap-3 sm:gap-5">
              {RONDA.map((t) => {
                const f = FOTOS_INTRO[t];
                return f ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={t} src={f.lleno} alt="" width={f.w} height={f.h} decoding="async" className="h-24 w-auto drop-shadow-[0_10px_12px_rgba(0,0,0,0.7)] sm:h-28 lg:h-32" />
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
