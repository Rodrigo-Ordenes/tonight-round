"use client";

import React, { useState, useEffect } from "react";
import { 
  Tv, 
  X, 
  Dices, 
  QrCode, 
  ChevronRight, 
  Sparkles, 
  Award,
  Users,
  Clock,
  Maximize2,
  Minimize2
} from "lucide-react";
import QRCode from "qrcode";
import { GameItem } from "./GameCard";

interface TVGameModeProps {
  games: GameItem[];
  activeGame: GameItem;
  isOpen: boolean;
  onClose: () => void;
  onNextRandomGame: () => void;
}

export default function TVGameMode({
  games,
  activeGame,
  isOpen,
  onClose,
  onNextRandomGame,
}: TVGameModeProps) {
  const [currentRuleIndex, setCurrentRuleIndex] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("https://tonight.cl");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.origin;
      setCurrentUrl(url);
      QRCode.toDataURL(url, {
        width: 180,
        margin: 1,
        color: {
          dark: "#090d16",
          light: "#ffffff",
        },
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, []);

  // Keyboard shortcut listener for remote controls (Space / ArrowRight / Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        onNextRandomGame();
        setCurrentRuleIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNextRandomGame]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fade-in overflow-hidden">
      {/* Top Bar for Smart TV */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-carrete-primary to-carrete-secondary flex items-center justify-center shadow-glow">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Tonight TV • Modo Sala
            </span>
            <span className="text-xs text-indigo-400 block font-semibold">
              Pantalla compartida para el carrete
            </span>
          </div>
        </div>

        {/* Exit & Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            <span>Salir de Modo TV (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Giant Stage Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 max-w-5xl mx-auto w-full text-center space-y-6">
        {/* Game Title Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-carrete-primary/20 border-2 border-carrete-primary/60 text-indigo-300 text-sm sm:text-base font-extrabold uppercase tracking-widest shadow-glow">
          <Sparkles className="w-5 h-5 text-carrete-secondary animate-pulse" />
          <span>{activeGame.name}</span>
        </div>

        {/* Big Catchy Description / Rules */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
            &ldquo;{activeGame.rules[currentRuleIndex] || activeGame.description}&rdquo;
          </h2>

          <p className="text-base sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            {activeGame.description}
          </p>
        </div>

        {/* Non-Alcoholic / Points Alternative Highlighted for the Room */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/50 max-w-2xl mx-auto text-emerald-200 text-left flex items-start gap-3 shadow-glow-accent">
          <Award className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-extrabold text-emerald-300 block mb-0.5 uppercase tracking-wide">
              Variante sin alcohol / por puntos:
            </span>
            <p className="leading-relaxed">
              {activeGame.non_alcoholic_variant}
            </p>
          </div>
        </div>

        {/* Big Next Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            onClick={() => {
              onNextRandomGame();
              setCurrentRuleIndex(0);
            }}
            className="min-h-[64px] px-8 sm:px-12 rounded-3xl bg-gradient-to-r from-carrete-primary via-indigo-600 to-carrete-secondary hover:brightness-110 text-white text-lg sm:text-xl font-black shadow-glow flex items-center gap-3 transition-transform active:scale-95 border border-white/20"
          >
            <Dices className="w-7 h-7 animate-bounce" />
            <span>Siguiente Dinámica / Girar Ruleta</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Meta info on Left & Giant QR on Right */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-4">
        {/* Left: Players and Materials */}
        <div className="flex items-center gap-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-carrete-primary" />
            <span>{activeGame.players}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{activeGame.duration}</span>
          </div>
          <div className="hidden sm:inline-block">
            <span>Materiales: <strong>{activeGame.materials}</strong></span>
          </div>
        </div>

        {/* Right: Giant QR for in-room attendees to scan with mobile camera */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-2.5 rounded-2xl shadow-xl">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Escanear para unirse desde el celular"
              className="w-14 h-14 rounded-lg bg-white p-0.5"
            />
          )}
          <div className="text-left pr-2">
            <div className="text-xs font-black text-white flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-carrete-primary" />
              <span>¡Escanea y ábrelo!</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
              Sin login ni descargas.<br />
              Copiloto en tu teléfono.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
