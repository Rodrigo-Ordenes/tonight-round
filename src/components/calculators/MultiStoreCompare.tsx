"use client";

import React from "react";
import { Store, ShoppingCart, Info, TrendingDown, Check } from "lucide-react";
import type { PriceBase, BasketItem } from "@/lib/carreteState";
import { STORE_LABEL, basketTotal } from "@/lib/basket";

interface MultiStoreCompareProps {
  items: BasketItem[];
  selectedBase: PriceBase;
  onSelectBase: (base: PriceBase) => void;
}

export default function MultiStoreCompare({
  items,
  selectedBase,
  onSelectBase,
}: MultiStoreCompareProps) {
  const liderTotal = basketTotal(items, "lider");
  const jumboTotal = basketTotal(items, "jumbo");
  const botiTotal = basketTotal(items, "botilleria");

  const stores: { id: PriceBase; label: string; total: number; subtitle: string }[] = [
    {
      id: "lider",
      label: "Líder",
      total: liderTotal,
      subtitle: "Supermercado económico",
    },
    {
      id: "jumbo",
      label: "Jumbo",
      total: jumboTotal,
      subtitle: "Variedad y marcas premium",
    },
    {
      id: "botilleria",
      label: "Botillería",
      total: botiTotal,
      subtitle: "Conveniente de noche / express",
    },
  ];

  // Cálculo de ahorro máximo
  const minTotal = Math.min(liderTotal, jumboTotal, botiTotal);
  const maxTotal = Math.max(liderTotal, jumboTotal, botiTotal);
  const maxSavings = maxTotal - minTotal;

  return (
    <div className="p-5 rounded-3xl bg-night-900/80 border border-slate-800 space-y-4">
      {/* Encabezado e indicador referencial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-night-800 pb-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-black text-white">Comparador Multitienda</h3>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Valor referencial estimado en Chile</span>
        </div>
      </div>

      <p className="text-xs text-slate-300">
        Calcular presupuesto base con precios de:
      </p>

      {/* Selector explícito de tienda base */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stores.map((store) => {
          const isSelected = selectedBase === store.id;
          const isCheapest = store.total === minTotal && store.total > 0;

          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelectBase(store.id)}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between ${
                isSelected
                  ? "bg-indigo-950/60 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                  : "bg-night-950/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-sm text-white">{store.label}</span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      <Check className="w-3 h-3" /> Activo
                    </span>
                  )}
                  {!isSelected && isCheapest && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Más bajo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{store.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-night-800 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">Total canasta:</span>
                <span className="text-base font-black text-white font-mono">
                  ${store.total.toLocaleString("es-CL")} CLP
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tarjeta de Ahorro */}
      {maxSavings > 0 && items.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Potencial de Ahorro: </span>
            <span>
              Ahorras hasta <strong>${maxSavings.toLocaleString("es-CL")} CLP</strong> comprando
              la canasta en {STORE_LABEL[stores.find((s) => s.total === minTotal)?.id || "lider"]}{" "}
              en lugar de {STORE_LABEL[stores.find((s) => s.total === maxTotal)?.id || "botilleria"]}.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
