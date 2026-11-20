"use client";

import React, { useEffect, useRef, useState } from "react";
import SlidingIndicator, { useActiveRect } from "@/components/ui/SlidingIndicator";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, GlassWater, Gamepad2, Radio, Receipt, ShoppingBasket, Volume2, VolumeX, WifiOff, X } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { SOLO, useCarreteStore } from "@/store/useCarreteStore";
import { syncStatus } from "@/lib/syncStatus";
import { useMuted } from "@/lib/useMuted";
import CountrySelector from "@/components/navigation/CountrySelector";
import LiveRoomPanel from "./LiveRoomPanel";
import LiveNudge from "@/components/live/LiveNudge";
import CheersOverlay from "@/components/live/CheersOverlay";
import { useDragDismiss } from "@/lib/useDragDismiss";

const NAV = [
  { key: "sala", label: "Sala", icon: Radio },
  { key: "armar", href: "/armar", label: "Armar", icon: ShoppingBasket },
  { key: "bar", href: "/bar", label: "Bar", icon: GlassWater },
  { key: "juegos", href: "/juegos", label: "Juegos", icon: Gamepad2 },
  { key: "musica", href: "/musica", label: "Música", icon: Disc3 },
  { key: "dividir", href: "/dividir", label: "Cuentas", icon: Receipt },
] as const;

export function BrandMark({ className = "" }: { className?: string }) {
  // Brindis: dos copas que chocan, como tubos de neón (azul y morado), con la chispa del choque
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g transform="rotate(16 8.5 20)" style={{ stroke: "var(--blue)" }} strokeWidth="2.2">
        <path d="M5 5 C5 12 6.5 16 8.5 16 C10.5 16 12 12 12 5" />
        <path d="M5.6 9 H11.4" strokeOpacity={0.7} />
        <path d="M8.5 16 V25 M5.5 25.5 H11.5" />
      </g>
      <g transform="rotate(-16 23.5 20)" style={{ stroke: "var(--violet-text)" }} strokeWidth="2.2">
        <path d="M20 5 C20 12 21.5 16 23.5 16 C25.5 16 27 12 27 5" />
        <path d="M20.6 9 H26.4" strokeOpacity={0.7} />
        <path d="M23.5 16 V25 M20.5 25.5 H26.5" />
      </g>
      <path d="M16 0.8 V3.8 M12.8 2 L14.3 4.2 M19.2 2 L17.7 4.2" style={{ stroke: "var(--signal)" }} strokeWidth="1.8" />
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
  const sheet = useDragDismiss(() => setSheetOpen(false));

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
  const room = useCarreteStore(hasRoom ? code : SOLO);
  const sync = syncStatus({ online: room.online, pending: room.pending });
  const salaHref = `/carrete/${hydrated ? code : SOLO}`;

  const isActive = (key: string, href?: string) =>
    key === "sala" ? pathname.startsWith("/carrete/") : href ? pathname.startsWith(href) : false;

  // Menú vivo (hooks antes del return de la TV: al volver de la TV cambiaba el número de hooks y React se caía): una píldora de neón viaja a la sección activa (dock del celular y barra lateral)
  const activeKey = NAV.find((item) => isActive(item.key, "href" in item ? item.href : undefined))?.key ?? null;
  const dockRef = useRef<HTMLDivElement>(null);
  const dockRect = useActiveRect(dockRef, '[aria-current="page"]', activeKey);

  if (isTv)
    return (
      <div className="relative z-10 min-h-[100dvh]">
        <div aria-hidden className="ambient-bg pointer-events-none fixed inset-0 -z-10" />
        {children}
      </div>
    );


  return (
    <div className="relative z-10 min-h-[100dvh]">
      {/* Fondo vivo común: penumbra con dos halos de neón que derivan lento (CSS, en el compositor) */}
      <div aria-hidden className="ambient-bg pointer-events-none fixed inset-0 -z-10" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-night-950">
        Saltar al contenido
      </a>
      {/* Sin panel lateral: en escritorio también manda el dock flotante y la barra superior ligera (inmersivo) */}

      {/* ---------- Escenario ---------- */}
      <div className="min-w-0">
        {/* Barra superior móvil */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] lg:border-transparent lg:bg-night-950/35">
          <div className="flex h-14 items-center gap-2 px-4 lg:mx-auto lg:h-16 lg:max-w-6xl lg:px-10">
            <Link href="/" className="flex items-center gap-2" aria-label="Tonight, inicio">
              <BrandMark className="neon-electric w-7 h-7" />
              <span className="neon-electric hidden font-display text-sm font-extrabold tracking-[0.18em] text-indigo-100 [animation-delay:0.3s,3.1s,0s] [text-shadow:0_0_10px_rgba(103,170,255,0.65)] min-[360px]:inline">TONIGHT</span>
            </Link>
            <div className="ml-auto flex min-w-0 items-center gap-1">
              {hasRoom && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-3.5 font-mono text-xs font-bold tracking-[0.2em] text-white"
                  aria-label={`Abrir sala ${code}. ${sync.label}`}
                >
                  {sync.tone === "offline" ? (
                    <WifiOff className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  ) : (
                    <span className={sync.tone === "sending" ? "h-2 w-2 rounded-full bg-amber-300" : "live-dot"} />
                  )}
                  {code}
                  <span aria-live="polite" className={sync.tone === "offline" ? "font-sans text-amber-200" : "sr-only"}>
                    {sync.tone === "offline" ? "Sin señal" : sync.label}
                  </span>
                </button>
              )}
              {!hasRoom && (
                // En escritorio, el panel en vivo se abre desde aquí (antes vivía en el panel lateral)
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  aria-label="Abrir panel en vivo"
                  className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-200 transition-colors hover:border-indigo-400/50 hover:text-white lg:inline-flex"
                >
                  <Radio className="h-4 w-4" aria-hidden /> En vivo
                </button>
              )}
              <MuteButton compact />
              <CountrySelector variant="compact" />
            </div>
          </div>
        </header>

        <main
          id="main"
          className={`relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 ${
            isGateway ? "pt-6 lg:pt-10" : "pt-5 lg:pt-8"
          } pb-[calc(110px+env(safe-area-inset-bottom,0px))]`}
        >
          {/* Parallax de página: una retícula de fondo que se queda atrás al bajar (la portada trae la suya) */}
          {!isGateway && <div aria-hidden className="tech-grid-page parallax-page pointer-events-none absolute inset-0 -z-10" />}
          {children}
        </main>
      </div>

      {hasRoom && <LiveNudge code={code} />}
      {hasRoom && <CheersOverlay code={code} />}

      {/* ---------- Dock flotante (celular y escritorio) ---------- */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl animate-dock-in rounded-[28px] border border-white/10 bg-night-900/80 p-1.5 shadow-lift backdrop-blur-2xl"
      >
        <div ref={dockRef} className="relative grid grid-cols-6">
          <SlidingIndicator rect={dockRect} className="rounded-[22px] bg-indigo-500 shadow-neon" />
          {NAV.map((item) => {
            const href = item.key === "sala" ? salaHref : item.href;
            const active = isActive(item.key, "href" in item ? item.href : undefined);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-[22px] text-xs font-bold transition-colors duration-300 [@media(max-height:480px)]:h-10 ${
                  active ? "text-night-950" : "text-slate-400"
                }`}
              >
                <Icon key={active ? "on" : "off"} className={`w-5 h-5 ${active ? "animate-nav-pop" : ""}`} aria-hidden />
                <span className="[@media(max-height:480px)]:sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Sala en vivo: hoja desde abajo en el celular, cajón desde la derecha en escritorio ---------- */}
      {sheetOpen && (
        <Modal label="Sala en vivo" onClose={() => setSheetOpen(false)} className="flex items-end justify-center bg-night-950/70 backdrop-blur-sm lg:items-stretch lg:justify-end">
          <div
            ref={sheet.panel}
            className="drawer-panel relative max-h-[86dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[20px] border border-white/10 bg-night-900 pb-[env(safe-area-inset-bottom,16px)] lg:h-full lg:max-h-none lg:max-w-[400px] lg:rounded-none lg:rounded-l-[24px] lg:border-y-0 lg:border-r-0 lg:shadow-[-24px_0_80px_-20px_rgba(185,62,243,0.25)]"
          >
            {/* Manija: arrastrar hacia abajo cierra la hoja (en el celular) */}
            <div {...sheet.handle} aria-hidden className="sticky top-0 z-10 flex h-7 cursor-grab touch-none items-center justify-center lg:hidden">
              <span className="h-1.5 w-10 rounded-full bg-white/25" />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <LiveRoomPanel code={hydrated ? code : SOLO} />
          </div>
        </Modal>
      )}
    </div>
  );
}
