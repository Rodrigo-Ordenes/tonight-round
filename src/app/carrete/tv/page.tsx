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
        width: 320,
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

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* PIN Gigante */}
          <div className="px-4 py-2 rounded-2xl bg-night-900 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">
              PIN DE ENTRADA
            </span>
            <span className="text-2xl font-black text-indigo-300 tracking-widest font-mono">
              {code}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="min-h-[48px] min-w-[48px] rounded-2xl bg-night-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center"
            title="Pantalla Completa"
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <Link
            href={`/carrete/${code}`}
            className="min-h-[48px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Carrete</span>
          </Link>
        </div>
      </div>

      {/* Hero Strip: Giant QR & Instructions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-night-950 via-slate-900 to-indigo-950/80 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
            🎮 Conexión Instantánea Sin Registro
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Escanea el código QR para sumar tragos y jugar desde tu celular
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Abre la cámara de tu teléfono y apunta al código. Tu celular se sincronizará automáticamente con el Monstruómetro y los juegos de esta pantalla.
          </p>
        </div>

        <div className="md:col-span-4 flex flex-col items-center justify-center">
          {qrUri ? (
            <img
              src={qrUri}
              alt={`QR para entrar a ${code}`}
              className="w-44 h-44 rounded-2xl bg-white p-2.5 shadow-2xl"
            />
          ) : (
            <div className="w-44 h-44 rounded-2xl bg-night-900 animate-pulse" />
          )}
          <span className="text-xs font-black text-indigo-300 mt-2">
            tonight.app · PIN: {code}
          </span>
        </div>
      </div>

      {/* Monstruómetro Grupal en Pantalla Grande (ReadOnly para TV) */}
      <div className="p-2">
        <MonstruometroRanking store={store} readOnly={true} />
      </div>
    </div>
  );
}
