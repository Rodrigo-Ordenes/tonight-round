"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tv, Maximize2, Minimize2, ArrowLeft, AlertCircle } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore, SOLO } from "@/store/useCarreteStore";
import MonstruometroRanking from "@/components/monsters/MonstruometroRanking";

export default function CarreteTVPage() {
  const router = useRouter();
  const { code, hydrated } = useActiveCode();
  const store = useCarreteStore(code);
  const [qrUri, setQrUri] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const hasValidCarrete = code !== SOLO && code.length === 4;

  useEffect(() => {
    if (typeof window !== "undefined" && hasValidCarrete) {
      const joinUrl = `${window.location.origin}/carrete/${code}?modo=celular`;
      QRCode.toDataURL(joinUrl, {
        width: 480,
        margin: 1,
        color: {
          dark: "#060911",
          light: "#ffffff",
        },
      })
        .then((uri) => setQrUri(uri))
        .catch(console.error);
    }
  }, [code, hasValidCarrete]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
    }
  };

  if (!hydrated || store.status === "loading") {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-sm text-slate-300 font-bold">Cargando Modo Smart TV...</p>
      </div>
    );
  }

  // Redirección si no hay carrete activo
  if (!hasValidCarrete || store.status === "missing") {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Modo TV Requiere un Carrete</h2>
        <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">
          Debes crear o ingresar a un carrete antes de activar el Modo TV para proyectar los tanques y el QR de tus amigos.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full min-h-[48px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm"
        >
          Crear o Unirme a un Carrete
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top TV Control Bar */}
      <div className="p-5 rounded-3xl bg-night-950/95 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Tonight TV • Pantalla Grande
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 animate-pulse">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proyecta en tu Smart TV para que los invitados jueguen desde el sillón
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* PIN Gigante Display (48px - 60px) */}
          <div className="px-5 py-2.5 rounded-2xl bg-night-900 border-2 border-indigo-500/50 text-center shadow-glow">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-widest">
              PIN DEL CARRETE
            </span>
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-indigo-300 tracking-widest font-mono">
              {code}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="min-h-[52px] min-w-[52px] rounded-2xl bg-night-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            title="Pantalla Completa"
          >
            {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>

          <Link
            href={`/carrete/${code}`}
            className="min-h-[52px] px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </Link>
        </div>
      </div>

      {/* Hero Strip: Giant QR & Instructions (16:9 Display Optimized) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-night-950 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/40 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl">
        <div className="md:col-span-7 space-y-4">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <span>🎮 MODO SALA / SMART TV 16:9</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Sincronización P2P & Servidor
            </span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight">
            Escanea para jugar y sumar tragos desde tu celular
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Apunta la cámara de tu teléfono al código QR. Tu móvil se convertirá en un mando personal sincronizado en vivo con el Monstruómetro y los juegos de esta pantalla.
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm font-bold text-indigo-300">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              Sin descargas de App Store
            </span>
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              100% Gratuito y Libre
            </span>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col items-center justify-center">
          {qrUri ? (
            <div className="p-3 bg-white rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.35)]">
              <img
                src={qrUri}
                alt={`QR para entrar a ${code}`}
                className="w-52 h-52 sm:w-60 sm:h-60 lg:w-64 lg:h-64 rounded-2xl"
              />
            </div>
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 lg:w-64 lg:h-64 rounded-3xl bg-night-900 animate-pulse" />
          )}
          <div className="text-center mt-3">
            <span className="text-sm sm:text-base font-black text-indigo-300 font-mono tracking-wider block">
              Entra a tonight.app con PIN: <span className="text-amber-400 font-black">{code}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Monstruómetro Grupal en Pantalla Grande (ReadOnly para TV) */}
      <div className="p-2">
        <MonstruometroRanking store={store} readOnly={true} />
      </div>
    </div>
  );
}
