"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink, Zap, AlertCircle } from "lucide-react";
import type { BasketItem, PriceBase } from "@/lib/carreteState";
import { buildOrderText, STORE_LABEL } from "@/lib/basket";
import { useLocale } from "@/lib/useLocale";

interface DeliveryTextExporterProps {
  items: BasketItem[];
  priceBase: PriceBase;
}

export default function DeliveryTextExporter({
  items,
  priceBase,
}: DeliveryTextExporterProps) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const activeItems = items.filter((i) => i.quantity > 0);
  const orderText = buildOrderText(activeItems, priceBase);

  // Producto principal para query de búsqueda
  const mainProduct = activeItems[0]?.name || "pisco cerveza hielo";
  const searchQuery = encodeURIComponent(mainProduct);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenDelivery = (url: string, appName: string) => {
    // Primero copiamos el texto exacto al portapapeles para conveniencia del usuario
    navigator.clipboard.writeText(orderText).catch(() => {});
    setActiveMessage(`Te abrimos la app con los productos sugeridos (${appName}). ¡Pega la lista que acabamos de copiar en tu carrito!`);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => setActiveMessage(null), 5000);
  };

  const services = locale?.delivery?.services || [
    { name: "PedidosYa", urlTemplate: "https://www.pedidosya.cl" },
    { name: "Rappi", urlTemplate: "https://www.rappi.cl" },
    { name: "Uber Eats", urlTemplate: "https://www.ubereats.com/cl" },
  ];

  const deliveryApps = services.map((s, idx) => {
    const isRappi = s.name.toLowerCase().includes("rappi");
    const isPedidos = s.name.toLowerCase().includes("pedidos");
    const isUber = s.name.toLowerCase().includes("uber");
    const isDoorDash = s.name.toLowerCase().includes("dash");

    let url = s.urlTemplate;
    if (url.includes("rappi")) url = `${s.urlTemplate}/search?query=${searchQuery}`;
    else if (url.includes("pedidosya")) url = `${s.urlTemplate}/busqueda?query=${searchQuery}`;
    else if (url.includes("ubereats")) url = `${s.urlTemplate}/search?q=${searchQuery}`;
    else if (url.includes("doordash")) url = `${s.urlTemplate}/search/store/${searchQuery}`;

    return {
      name: s.name,
      badge: isRappi ? "Turbo 10-25 min" : isPedidos ? "Express 20-30 min" : isDoorDash ? "DoorPass" : "Supermercados",
      url,
      bgClass: isRappi
        ? "hover:bg-orange-950/40 border-orange-500/40 text-orange-400"
        : isPedidos
        ? "hover:bg-red-950/40 border-red-500/40 text-red-400"
        : isUber
        ? "hover:bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
        : "hover:bg-indigo-950/40 border-indigo-500/40 text-indigo-300",
    };
  });

  return (
    <div className="p-5 rounded-3xl bg-night-900/80 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-800 pb-3">
        <div>
          <h3 className="font-black text-base text-white">Pedir Canasta por Delivery</h3>
          <p className="text-xs text-slate-400">
            Exporta el pedido exacto o abre las apps con la búsqueda precargada
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="min-h-[48px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">¡Pedido Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copiar Pedido Exacto</span>
            </>
          )}
        </button>
      </div>

      {activeMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 text-xs text-indigo-200 flex items-start gap-2.5 animate-fade-in">
          <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>{activeMessage}</span>
        </div>
      )}

      {/* Vista previa del texto a copiar */}
      <div className="p-3.5 rounded-2xl bg-night-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed select-all">
        {orderText}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-300 font-semibold">
          Te abrimos la app con los productos sugeridos:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {deliveryApps.map((app) => (
            <button
              key={app.name}
              type="button"
              onClick={() => handleOpenDelivery(app.url, app.name)}
              className={`min-h-[50px] p-3 rounded-2xl border bg-night-950/70 flex items-center justify-between transition-all active:scale-98 ${app.bgClass}`}
            >
              <div className="text-left">
                <span className="font-black text-sm text-white block">{app.name}</span>
                <span className="text-[10px] text-slate-400">{app.badge}</span>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
