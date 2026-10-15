"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, PhoneCall } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { COUNTRIES } from "@/config/locales";

interface DisclaimerModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

/** Edad mínima legal para comprar o beber alcohol en cada país soportado. */
const LEGAL_AGE: Record<string, number> = { CL: 18, MX: 18, US: 21, JP: 20 };

const RULES = [
  { emoji: "👑", title: "Si tomas, no manejas", text: "La única cifra segura al volante es 0.00. Siempre hay alguien de conductor o un transporte." },
  { emoji: "🧪", title: "Las cifras son estimaciones", text: "La alcoholemia que ves es educativa (fórmula de Widmark), no una medición. No sirve para decidir si manejar." },
  { emoji: "💧", title: "Agua entre trago y trago", text: "La app te lo recuerda. Comer y alternar con agua hace que la noche dure más y la caña sea menor." },
];

/** Bienvenida de la primera visita: reglas de la casa, edad legal y marco legal del país. */
export default function DisclaimerModal({ forceOpen = false, onClose }: DisclaimerModalProps) {
  const { locale, country, setCountry } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  useEffect(() => {
    if (forceOpen || !localStorage.getItem("tonight_disclaimer_ack")) setIsOpen(true);
  }, [forceOpen]);

  const accept = () => {
    localStorage.setItem("tonight_disclaimer_ack", "true");
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;
  const age = LEGAL_AGE[country] ?? 18;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night-950/85 p-0 backdrop-blur-md animate-fade-in sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-night-900 shadow-lift sm:rounded-[32px]"
      >
        <span className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden />
        <div className="relative overflow-y-auto p-6 sm:p-8">
          <p className="eyebrow">Bienvenida</p>
          <h2 id="welcome-title" className="display mt-2 text-4xl">
            Antes de empezar<span className="text-gradient-ember">.</span>
          </h2>

          <div className="mt-5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="País">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                role="radio"
                aria-checked={country === c.code}
                onClick={() => setCountry(c.code)}
                className={`chip ${country === c.code ? "chip-on" : ""}`}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-4">
            {RULES.map((r) => (
              <li key={r.title} className="flex gap-4">
                <span className="text-2xl">{r.emoji}</span>
                <span>
                  <span className="block font-display text-lg font-bold text-white">{r.title}</span>
                  <span className="block text-sm leading-relaxed text-slate-300">{r.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setLegalOpen(!legalOpen)}
            aria-expanded={legalOpen}
            className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-slate-200"
          >
            <span>
              {locale.legal.lawsTitle || locale.legal.lawName} · {locale.legal.bacLimitText}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${legalOpen ? "rotate-180" : ""}`} />
          </button>
          {legalOpen && (
            <div className="mt-2 space-y-3 rounded-2xl bg-white/[0.02] p-4 text-xs leading-relaxed text-slate-300 animate-fade-in">
              <p>{locale.legal.disclaimerText || locale.legal.disclaimer}</p>
              {locale.legal.penaltiesSummary && <p className="whitespace-pre-line">{locale.legal.penaltiesSummary}</p>}
              <p className="flex items-center gap-2 font-semibold text-emerald-200">
                <PhoneCall className="w-4 h-4" /> Emergencias en {locale.countryName}: {locale.legal.emergencyNumber}
              </p>
            </div>
          )}
        </div>

        <div className="relative border-t border-white/[0.06] p-5 sm:px-8">
          <button type="button" onClick={accept} className="btn-primary w-full !min-h-[54px] text-base">
            Tengo {age} años o más · Entrar
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Tonight es para mayores de {age} años, la edad legal para beber en {locale.countryName}.
          </p>
        </div>
      </div>
    </div>
  );
}
