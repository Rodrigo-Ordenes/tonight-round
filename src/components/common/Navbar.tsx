"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  ShoppingCart, 
  Dices, 
  Users,
  Clock, 
  Receipt, 
  HelpCircle,
  Home,
  Tv,
  Wine,
  ShieldCheck,
  Globe
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home, shortLabel: "Inicio" },
  { href: "/armar", label: "Armar", icon: ShoppingCart, shortLabel: "Armar" },
  { href: "/bar", label: "Bar", icon: Wine, shortLabel: "Bar" },
  { href: "/sala", label: "Salas TV", icon: Tv, shortLabel: "Salas" },
  { href: "/grupo", label: "Ronda", icon: Users, shortLabel: "Ronda" },
  { href: "/juegos", label: "Juegos", icon: Dices, shortLabel: "Juegos" },
  { href: "/seguridad", label: "Retorno", icon: ShieldCheck, shortLabel: "Retorno" },
  { href: "/dividir", label: "Dividir", icon: Receipt, shortLabel: "Dividir" },
  { href: "/mitos", label: "Mitos", icon: HelpCircle, shortLabel: "Mitos" },
];

const COUNTRIES = [
  { code: "CL", flag: "🇨🇱", name: "Chile", currency: "CLP", slang: "Carrete / Piscola" },
  { code: "MX", flag: "🇲🇽", name: "México", currency: "MXN", slang: "Peda / Chelas" },
  { code: "US", flag: "🇺🇸", name: "USA", currency: "USD", slang: "Party / Seltzers" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [selectedCountry, setSelectedCountry] = useState<string>("CL");
  const [showCountryMenu, setShowCountryMenu] = useState<boolean>(false);

  const activeCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <>
      {/* Top Header for Desktop & Tablet */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-night-800 bg-night-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-carrete-primary to-carrete-secondary flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                Tonight
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-bold bg-carrete-primary/20 text-indigo-300 border border-carrete-primary/30">
                V6
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-carrete-primary text-white shadow-glow"
                        : "text-slate-400 hover:text-white hover:bg-night-850"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Country Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountryMenu(!showCountryMenu)}
                className="flex items-center gap-1.5 text-xs bg-night-850 hover:bg-night-800 border border-night-700/60 px-2.5 py-1.5 rounded-full text-slate-200 transition-all active:scale-95"
              >
                <span>{activeCountry.flag}</span>
                <span className="font-extrabold">{activeCountry.code}</span>
                <span className="text-[10px] text-slate-400">({activeCountry.currency})</span>
              </button>

              {/* Dropdown Menu */}
              {showCountryMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-panel bg-night-950 border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-50 animate-fade-in text-xs space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Región & Moneda
                  </div>
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.code);
                        setShowCountryMenu(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                        selectedCountry === c.code
                          ? "bg-carrete-primary text-white font-bold"
                          : "text-slate-300 hover:bg-night-850 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{c.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (9 items ergonomically arranged) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-night-800 bg-night-950/95 backdrop-blur-lg px-1 pb-[env(safe-area-inset-bottom,8px)] pt-1">
        <div className="grid grid-cols-9 gap-0.5 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 rounded-xl transition-all ${
                  isActive
                    ? "text-indigo-400 font-bold"
                    : "text-slate-400 hover:text-slate-200 active:scale-95"
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? "bg-carrete-primary/20 text-carrete-primary" : ""
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] tracking-tight leading-tight mt-0.5 truncate max-w-full">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
