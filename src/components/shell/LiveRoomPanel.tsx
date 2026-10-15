"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Check, Copy, Crown, Droplets, LogOut, Plus, Tv, Users, WifiOff } from "lucide-react";
import { SOLO, setActiveCode, useCarreteStore } from "@/store/useCarreteStore";
import { DRINK_PRESETS, bacFor } from "@/lib/alcohol";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { nightMoment } from "@/lib/nightMoment";
import NowPlayingMini from "@/components/music/NowPlayingMini";
import LiveRoundCard from "@/components/live/LiveRoundCard";

/** Panel persistente de la sala: quién está, cómo va cada uno y acciones rápidas, al lado de cualquier sección. */
export default function LiveRoomPanel({ code }: { code: string }) {
  if (code === SOLO) return <SoloPanel />;
  return <RoomPanel code={code} />;
}

function SoloPanel() {
  const moment = nightMoment(new Date());
  return (
    <div className="flex h-full flex-col gap-5 p-6">
      <div>
        <p className="eyebrow">{moment.eyebrow}</p>
        <h2 className="display mt-2 text-3xl">{moment.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{moment.hint}</p>
      </div>
      <div className="surface p-5">
        <Users className="w-6 h-6 text-indigo-400" />
        <p className="mt-3 font-display text-lg font-bold text-white">Estás en modo solo</p>
        <p className="mt-1 text-sm text-slate-400">
          Crea una sala y tus amigos se unen con un código de 4 letras: tragos, juegos y cuentas en vivo en todos los celulares y la TV.
        </p>
        <Link href="/" className="btn-primary mt-4 w-full">
          Crear sala
        </Link>
      </div>
      <NowPlayingMini />
    </div>
  );
}

function RoomPanel({ code }: { code: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const store = useCarreteStore(code);
  const { participants, meId, online, status } = store;
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const url = `${window.location.origin}/carrete/${code}?modo=celular`;
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#07060A", light: "#F7F5F3" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);

  const rows = useMemo(
    () =>
      participants
        .map((p) => ({ p, bac: bacFor(p, now).bac }))
        .sort((a, b) => (a.p.id === meId ? -1 : b.p.id === meId ? 1 : b.bac - a.bac)),
    [participants, meId, now]
  );

  const me = participants.find((p) => p.id === meId);
  const lastDrink = me?.consumptions[me.consumptions.length - 1];
  const quickPreset = lastDrink
    ? { label: lastDrink.label, ml: lastDrink.ml, abv: lastDrink.abv }
    : DRINK_PRESETS[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/carrete/${code}?modo=celular`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  };

  const leave = () => {
    setActiveCode(null);
    router.push("/");
  };

  const moment = nightMoment(new Date(now));

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Cabecera de sala */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">
            {online ? <span className="live-dot" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            {online ? "Sala en vivo" : "Sin señal · guardando"}
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.18em] text-white">{code}</p>
          <p className="mt-1 text-xs text-slate-400">
            {moment.eyebrow} · {participants.length} {participants.length === 1 ? "persona" : "personas"}
          </p>
        </div>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR para unirse a la sala ${code}`} className="h-24 w-24 rounded-2xl" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className="btn-ghost !min-h-[42px] !px-3 text-xs">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado" : "Invitar"}
        </button>
        <Link href={`/carrete/tv?code=${code}`} className="btn-ghost !min-h-[42px] !px-3 text-xs">
          <Tv className="w-4 h-4" /> Modo TV
        </Link>
      </div>

      <LiveRoundCard store={store} compact />

      {/* Acciones rápidas del dueño de este celular */}
      {me ? (
        <div className="surface p-4">
          <p className="eyebrow">Tú · {me.name}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                store.addConsumption(me.id, quickPreset);
                audioEffects.playBubble();
              }}
              disabled={me.role === "driver"}
              className="btn !min-h-[52px] !px-3 bg-indigo-500/15 text-indigo-100 border border-indigo-400/30 hover:bg-indigo-500/25 text-xs"
            >
              <Plus className="w-4 h-4" /> {me.role === "driver" ? "Conduces 0.0" : quickPreset.label.split(" ")[0]}
            </button>
            <button
              type="button"
              onClick={() => {
                store.addWater(me.id);
                audioEffects.playBubble();
              }}
              className="btn !min-h-[52px] !px-3 bg-cyan-400/10 text-cyan-100 border border-cyan-300/30 hover:bg-cyan-400/20 text-xs"
            >
              <Droplets className="w-4 h-4" /> Agua · {me.waterCount}
            </button>
          </div>
        </div>
      ) : (
        status === "ready" && (
          <Link href={`/carrete/${code}?modo=celular`} className="btn-primary">
            Entrar como invitado
          </Link>
        )
      )}

      {/* Quién está */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">La mesa</p>
          <Link href={`/carrete/${code}`} className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
            Ver sala →
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            Todavía no llega nadie. Comparte el código {code}.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map(({ p, bac }) => {
              const driver = p.role === "driver";
              const pct = Math.min(100, (bac / 1.2) * 100);
              const tone = driver
                ? bac > 0
                  ? "bg-rose-500"
                  : "bg-amber-400"
                : bac >= 0.8
                ? "bg-rose-500"
                : bac >= 0.3
                ? "bg-amber-400"
                : "bg-emerald-400";
              return (
                <li key={p.id} className="rounded-2xl bg-white/[0.03] px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    {driver && <Crown className="w-3.5 h-3.5 text-amber-400" aria-label={locale.terminology.driverTitle} />}
                    <span className={`truncate font-semibold ${p.id === meId ? "text-white" : "text-slate-200"}`}>
                      {p.name}
                      {p.id === meId && <span className="ml-1 text-[10px] text-slate-400">(tú)</span>}
                    </span>
                    <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-slate-400 tabular">
                      {p.waterCount > 0 && <span className="text-cyan-300">💧{p.waterCount}</span>}
                      {bac.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${tone} transition-[width] duration-700`} style={{ width: `${Math.max(pct, driver ? 100 : 2)}%`, opacity: driver && bac === 0 ? 0.35 : 1 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Estimación educativa (Widmark) en g/l. {locale.legal.bacLimitText}: si bebiste, no manejes.
        </p>
      </div>

      <NowPlayingMini code={code} />

      <button type="button" onClick={leave} className="mt-2 flex items-center gap-2 self-start text-xs font-semibold text-slate-500 hover:text-slate-300">
        <LogOut className="w-3.5 h-3.5" /> Salir de esta sala en este dispositivo
      </button>
    </div>
  );
}
