"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Home, ShoppingCart, GlassWater, Gamepad2, Receipt, ShieldCheck } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { SOLO, setActiveCode } from "@/store/useCarreteStore";

import CountrySelector from "./CountrySelector";

const SECTION_LABEL: Record<string, string> = {
  armar: "Armar",
  bar: "Bar",
  juegos: "Juegos",
  dividir: "Dividir",
  mitos: "Mitos",
  seguridad: "Seguridad",
  tiempo: "Tiempo",
  tv: "Modo TV",
};

const NAV = [
  { href: "/armar", label: "Armar", icon: ShoppingCart },
  { href: "/bar", label: "Bar", icon: GlassWater },
  { href: "/juegos", label: "Juegos", icon: Gamepad2 },
  { href: "/dividir", label: "Dividir", icon: Receipt },
  { href: "/seguridad", label: "Seguridad", icon: ShieldCheck },
];

export default function GlobalNavbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { code } = useActiveCode();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const hasRealCarrete = code !== SOLO;
  const home = hasRealCarrete ? `/carrete/${code}` : "/";
  const segments = pathname.split("/").filter(Boolean);
  const isGateway = pathname === "/";
  const isCarreteHome = /^\/carrete\/[^/]+$/.test(pathname) && segments[1] !== "tv";
  const section = isCarreteHome ? null : SECTION_LABEL[segments[segments[0] === "carrete" ? 1 : 0]] ?? null;

  const handleBack = () => {
    if (isCarreteHome) {
      if (hasRealCarrete) setConfirmLeave(true);
      else router.push("/");
    } else {
      router.push(isGateway ? "/" : home);
    }
  };

  const leave = () => {
    setConfirmLeave(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-night-950/90 backdrop-blur-md border-b border-night-800 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 min-h-[56px] flex items-center gap-2">
          {!isGateway && (
            <button
              onClick={handleBack}
              aria-label="Volver"
              className="min-h-[48px] min-w-[48px] px-3 rounded-xl text-slate-200 hover:bg-white/10 flex items-center gap-1.5 text-sm font-bold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}

          <Link href={home} className="min-h-[48px] flex items-center gap-2 px-1 font-black tracking-tight text-white">
            <span className="text-xl">🌙</span>
            <span>TONIGHT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              V9
            </span>
          </Link>

          {/* Breadcrumbs */}
          {!isGateway && (
            <nav aria-label="breadcrumb" className="hidden sm:flex items-center gap-1 text-xs text-slate-400 min-w-0 ml-2">
              <Link href="/" className="hover:text-white flex items-center gap-1">
                <Home className="w-3 h-3" /> Inicio
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={home} className="hover:text-white truncate">
                {hasRealCarrete ? `Mi Carrete ${code}` : "Modo Solo"}
              </Link>
              {section && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white font-bold">{section}</span>
                </>
              )}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`min-h-[48px] px-3 rounded-xl text-sm font-bold flex items-center ${
                    pathname.startsWith(href) ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <CountrySelector variant="compact" />
          </div>
        </div>
      </header>

      {/* Bottom nav móvil */}
      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-night-950/95 backdrop-blur-md border-t border-night-800 pb-[env(safe-area-inset-bottom,16px)]"
      >
        <div className="grid grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
                pathname.startsWith(href) ? "text-indigo-300" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {confirmLeave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-night-900 border border-indigo-500/30 p-6 space-y-4 text-center">
            <h3 className="text-lg font-black text-white">¿Salir del carrete?</h3>
            <p className="text-sm text-slate-300">
              Tu sesión se mantendrá guardada con el código{" "}
              <span className="font-black text-indigo-300 tracking-widest">{code}</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmLeave(false)} className="min-h-[48px] rounded-xl bg-slate-800 text-slate-200 font-bold text-sm">
                Quedarme
              </button>
              <button onClick={leave} className="min-h-[48px] rounded-xl bg-indigo-600 text-white font-black text-sm">
                Salir
              </button>
            </div>
            <button
              onClick={() => {
                setActiveCode(null);
                leave();
              }}
              className="min-h-[48px] text-xs text-slate-400 underline"
            >
              Salir y olvidar este carrete en este dispositivo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
