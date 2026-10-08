"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, 
  ExternalLink, 
  Zap, 
  Clock, 
  Copy, 
  Check, 
  Store, 
  Smartphone,
  Globe
} from "lucide-react";

interface DeliveryAppOption {
  name: string;
  tagline: string;
  webUrl: string;
  appScheme?: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  bgHover: string;
}

interface DeliveryDeepLinksProps {
  countryCode?: "CL" | "MX" | "US";
  searchTerm?: string;
}

export default function DeliveryDeepLinks({
  countryCode = "CL",
  searchTerm = "pisco cerveza hielo",
}: DeliveryDeepLinksProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const cleanSearch = searchTerm || "pisco cerveza hielo";
  const encodedQuery = encodeURIComponent(cleanSearch);

  // Chilean verified delivery platforms & specialized liquor stores
  const appsCL: DeliveryAppOption[] = [
    {
      name: "Rappi Chile",
      tagline: "Licores, botillerías y Turbo 10 min",
      webUrl: `https://www.rappi.cl/search?term=${encodeURIComponent("pisco cerveza")}`,
      appScheme: `rappi://search?query=${encodeURIComponent("pisco")}`,
      badge: "Express 15-30 min",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/40",
      borderColor: "border-orange-500/40 hover:border-orange-500",
      bgHover: "hover:bg-orange-950/30",
    },
    {
      name: "PedidosYa",
      tagline: "Mercados, botillerías de barrio y licores",
      webUrl: "https://www.pedidosya.cl/",
      appScheme: "pedidosya://",
      badge: "20-35 min",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/40",
      borderColor: "border-red-500/40 hover:border-red-500",
      bgHover: "hover:bg-red-950/30",
    },
    {
      name: "Uber Eats",
      tagline: "Supermercados y tiendas de conveniencia",
      webUrl: "https://www.ubereats.com/cl",
      appScheme: "ubereats://",
      badge: "25-40 min",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      borderColor: "border-emerald-500/40 hover:border-emerald-500",
      bgHover: "hover:bg-emerald-950/30",
    },
    {
      name: "Booz.cl (Botillería Express)",
      tagline: "Botillería online chilena con despacho en 30 min",
      webUrl: "https://www.booz.cl/",
      badge: "Especialista Licores",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      borderColor: "border-purple-500/40 hover:border-purple-500",
      bgHover: "hover:bg-purple-950/30",
    },
    {
      name: "Líquidos.cl",
      tagline: "Catálogo completo de destilados y packs",
      webUrl: "https://www.liquidos.cl/",
      badge: "Precios Mayoristas",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      borderColor: "border-blue-500/40 hover:border-blue-500",
      bgHover: "hover:bg-blue-950/30",
    },
    {
      name: "Líder Supermercado",
      tagline: "Pasillo de bebidas, licores y hielo",
      webUrl: "https://www.lider.cl/supermercado/category/Bebidas-y-Licores",
      badge: "Precios Bajos",
      badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/40",
      borderColor: "border-sky-500/40 hover:border-sky-500",
      bgHover: "hover:bg-sky-950/30",
    },
  ];

  const handleOpenApp = (app: DeliveryAppOption) => {
    // Attempt native app scheme on mobile devices if available
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && app.appScheme) {
      // Create hidden iframe or window location to trigger app intent
      const start = Date.now();
      window.location.href = app.appScheme;
      setTimeout(() => {
        // Fallback to web URL if app didn't open within 1.5s
        if (Date.now() - start < 2000) {
          window.open(app.webUrl, "_blank", "noopener,noreferrer");
        }
      }, 1200);
    } else {
      window.open(app.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopySearchTerms = async () => {
    try {
      await navigator.clipboard.writeText(cleanSearch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Error al copiar texto:", err);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-3xl space-y-4 border-indigo-500/30 bg-night-950/90 shadow-glow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-night-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              Pide los Insumos en Delivery Express
            </h3>
            <p className="text-[11px] text-slate-400">
              Enlaces directos y verificados para abrir en tu celular o computador
            </p>
          </div>
        </div>

        {/* Quick copy terms button */}
        <button
          type="button"
          onClick={handleCopySearchTerms}
          className="text-[11px] font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-night-900 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">¡Búsqueda copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar lista de productos</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Toca cualquiera de las opciones para abrir la app instalada en tu teléfono o su tienda online:
      </p>

      {/* Grid of Verified Apps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {appsCL.map((app) => (
          <button
            key={app.name}
            type="button"
            onClick={() => handleOpenApp(app)}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between bg-night-900/90 ${app.borderColor} ${app.bgHover}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-sm text-white">{app.name}</span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${app.badgeColor}`}>
                  {app.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {app.tagline}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-night-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-bold">
              <span>Abrir app / sitio web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
