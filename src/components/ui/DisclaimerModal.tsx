"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldCheck, X, Car, PhoneCall } from "lucide-react";
import clLocale from "@/config/locales/cl";

interface DisclaimerModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function DisclaimerModal({
  forceOpen = false,
  onClose,
}: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    // Check if previously acknowledged
    const acknowledged = localStorage.getItem("tonight_disclaimer_ack");
    if (!acknowledged) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    localStorage.setItem("tonight_disclaimer_ack", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel bg-night-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-carrete-danger to-carrete-primary" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Consumo Responsable y Marco Legal
              </h3>
              <p className="text-xs font-semibold text-amber-400">
                {clLocale.legal.lawsTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-night-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-4 overflow-y-auto pr-1 text-slate-300 text-sm leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium flex gap-3">
            <Car className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-1">
                SI BEBES, NUNCA MANEJES. CERO TOLERANCIA.
              </p>
              <p>
                {clLocale.legal.disclaimerText}
              </p>
            </div>
          </div>

          <div className="bg-night-900/80 rounded-2xl p-4 border border-night-800 text-xs space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Límites Legales en Chile
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p>
                  <strong>0.30 a 0.79 g/l:</strong> Bajo la influencia del alcohol.
                  Sanciones penales y suspensión de licencia de 3 meses a 5 años.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p>
                  <strong>≥ 0.80 g/l:</strong> Estado de ebriedad. Suspensión de 2 años
                  hasta cancelación perpetua, con penas efectivas de cárcel bajo Ley Emilia.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-night-900 border border-night-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Emergencias Chile:</span>
            </div>
            <span className="font-bold text-emerald-400">
              {clLocale.legal.emergencyNumber}
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-5 pt-3 border-t border-night-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl font-bold bg-carrete-primary hover:bg-indigo-500 text-white shadow-glow flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Entiendo y Acepto el Uso Responsable</span>
          </button>
        </div>
      </div>
    </div>
  );
}
