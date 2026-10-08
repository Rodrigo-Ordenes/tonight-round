"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "@/lib/useLocale";
import { CountryCode } from "@/config/locales";
import { audioEffects } from "@/lib/audioEffects";
import { Globe, ChevronDown, Check } from "lucide-react";

interface Props {
  variant?: "compact" | "full";
}

export default function CountrySelector({ variant = "compact" }: Props) {
  const { country, locale, setCountry, countries } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const select = (c: CountryCode) => {
    audioEffects.playPop();
    setCountry(c);
    setOpen(false);
  };

  if (variant === "full") {
    return (
      <div className="w-full space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>País & Cultura Nocturna</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {countries.map((c) => {
            const active = country === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c.code)}
                className={`min-h-[48px] p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  active
                    ? "bg-indigo-600/30 border-indigo-400 text-white shadow-glow"
                    : "bg-night-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-night-850"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-xs font-black">{c.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {c.slang}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant "compact" for Navbar
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => {
          audioEffects.playPop();
          setOpen((prev) => !prev);
        }}
        aria-label="Seleccionar país"
        aria-expanded={open}
        className="min-h-[44px] px-2.5 py-1 rounded-xl bg-night-900 border border-slate-700 hover:border-indigo-500/50 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
      >
        <span className="text-base">{locale.flag}</span>
        <span className="hidden sm:inline font-mono">{country}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-night-950/95 border border-indigo-500/40 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-night-800">
            Cultura Nocturna & Leyes
          </div>
          {countries.map((c) => {
            const active = country === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c.code)}
                className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                  active
                    ? "bg-indigo-600 text-white font-black"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.flag}</span>
                  <div>
                    <span className="block text-xs leading-none">{c.name}</span>
                    <span className={`text-[10px] ${active ? "text-indigo-200" : "text-slate-400"} font-normal`}>
                      {c.slang}
                    </span>
                  </div>
                </div>
                {active && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
