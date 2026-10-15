"use client";

import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, GlassWater, Gamepad2, Radio, Receipt, ShoppingBasket, Volume2, VolumeX, X } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { SOLO } from "@/store/useCarreteStore";
import { useMuted } from "@/lib/useMuted";
import CountrySelector from "@/components/navigation/CountrySelector";
import LiveRoomPanel from "./LiveRoomPanel";
import LiveNudge from "@/components/live/LiveNudge";

const NAV = [
  { key: "sala", label: "Sala", icon: Radio },
  { key: "armar", href: "/armar", label: "Armar", icon: ShoppingBasket },
  { key: "bar", href: "/bar", label: "Bar", icon: GlassWater },
  { key: "juegos", href: "/juegos", label: "Juegos", icon: Gamepad2 },
  { key: "musica", href: "/musica", label: "Música", icon: Disc3 },
  { key: "dividir", href: "/dividir", label: "Cuentas", icon: Receipt },
] as const;

function MoonMark({ className = "" }: { className?: string }) {
  const gid = `mm-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD2C2" />
          <stop offset="0.5" stopColor="#FF5E36" />
          <stop offset="1" stopColor="#9C82FF" />
        </linearGradient>
      </defs>
      <path d="M20.5 3.5A12.5 12.5 0 1 0 28.5 22 10 10 0 0 1 20.5 3.5Z" fill={`url(#${gid})`} />
      <circle cx="24.5" cy="8.5" r="1.6" fill="#86E64C" />
    </svg>
  );
}

function MuteButton({ compact = false }: { compact?: boolean }) {
  const [muted, setMuted] = useMuted();
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? "Activar sonido" : "Silenciar sonidos y vibración"}
      className={`flex items-center justify-center rounded-2xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors ${
        compact ? "w-11 h-11" : "w-14 h-12"
      }`}
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { code, hydrated } = useActiveCode();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => setSheetOpen(false), [pathname]);

  // PWA: caché offline (solo en producción para no interferir con el hot reload)
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const isTv = pathname.startsWith("/carrete/tv");
  const isGateway = pathname === "/";
  const hasRoom = hydrated && code !== SOLO;
  const salaHref = `/carrete/${hydrated ? code : SOLO}`;

  if (isTv) return <div className="relative z-10 min-h-[100dvh]">{children}</div>;

  const isActive = (key: string, href?: string) =>
    key === "sala" ? pathname.startsWith("/carrete/") : href ? pathname.startsWith(href) : false;

  return (
    <div className="relative z-10 min-h-[100dvh] lg:grid lg:grid-cols-[92px_minmax(0,1fr)] xl:grid-cols-[92px_minmax(0,1fr)_360px]">
      {/* ---------- Rail de escritorio ---------- */}
      <aside className="hidden lg:flex sticky top-0 h-[100dvh] flex-col items-center gap-2 border-r border-white/[0.06] bg-night-950/40 py-5 backdrop-blur-xl">
        <Link href="/" aria-label="Tonight, inicio" className="mb-4 flex flex-col items-center gap-1">
          <MoonMark className="w-9 h-9" />
          <span className="font-display text-[11px] font-extrabold tracking-[0.2em] text-white">TONIGHT</span>
        </Link>
        <nav aria-label="Navegación principal" className="flex flex-col gap-1">
          {NAV.map((item) => {
            const href = item.key === "sala" ? salaHref : item.href;
            const active = isActive(item.key, "href" in item ? item.href : undefined);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex w-[72px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? "bg-white/[0.07] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-indigo-500 text-night-950" : "group-hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2">
          <MuteButton />
          <CountrySelector variant="compact" placement="up-right" />
        </div>
      </aside>

      {/* ---------- Escenario ---------- */}
      <div className="min-w-0">
        {/* Barra superior móvil */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link href="/" className="flex items-center gap-2" aria-label="Tonight, inicio">
              <MoonMark className="w-7 h-7" />
              <span className="font-display text-sm font-extrabold tracking-[0.18em] text-white">TONIGHT</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              {hasRoom && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-3.5 font-mono text-xs font-bold tracking-[0.2em] text-white"
                  aria-label={`Abrir sala en vivo ${code}`}
                >
                  <span className="live-dot" />
                  {code}
                </button>
              )}
              <MuteButton compact />
              <CountrySelector variant="compact" />
            </div>
          </div>
        </header>

        <main
          className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 ${
            isGateway ? "pt-6 lg:pt-10" : "pt-5 lg:pt-8"
          } pb-[calc(110px+env(safe-area-inset-bottom,0px))] lg:pb-16`}
        >
          {children}
        </main>
      </div>

      {/* ---------- Panel de sala en vivo (tercer escritorio) ---------- */}
      <aside className="hidden xl:block sticky top-0 h-[100dvh] overflow-y-auto no-scrollbar border-l border-white/[0.06] bg-night-950/40 backdrop-blur-xl">
        <LiveRoomPanel code={hydrated ? code : SOLO} />
      </aside>

      {hasRoom && <LiveNudge code={code} />}

      {/* ---------- Dock flotante móvil ---------- */}
      <nav
        aria-label="Navegación principal"
        className="lg:hidden fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 rounded-[28px] border border-white/10 bg-night-900/80 p-1.5 shadow-lift backdrop-blur-2xl"
      >
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const href = item.key === "sala" ? salaHref : item.href;
            const active = isActive(item.key, "href" in item ? item.href : undefined);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-colors ${
                  active ? "bg-indigo-500 text-night-950" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Hoja de sala en móvil / tablet ---------- */}
      {sheetOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end justify-center bg-night-950/70 backdrop-blur-sm" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sala en vivo"
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border border-white/10 bg-night-900 pb-[env(safe-area-inset-bottom,16px)] animate-rise-in"
          >
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <LiveRoomPanel code={code} />
          </div>
        </div>
      )}
    </div>
  );
}
