"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import {
  generateBasket,
  basketTotal,
  unitPrice,
  STORE_LABEL,
  type CatalogItem,
} from "@/lib/basket";
import type { BasketItem, BasketProfile, PriceBase } from "@/lib/carreteState";
import BudgetStatus from "./BudgetStatus";
import SearchableProductModal from "./SearchableProductModal";
import MultiStoreCompare from "./MultiStoreCompare";
import DeliveryTextExporter from "./DeliveryTextExporter";
import { audioEffects } from "@/lib/audioEffects";

export default function CarreteBasketView() {
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const { basket, patchBasket } = store;

  const [modalOpen, setModalOpen] = useState(false);

  // Inicializar la canasta si está vacía
  useEffect(() => {
    if (store.status === "ready" && basket.items.length === 0) {
      const initial = generateBasket(basket.profile, basket.attendees, basket.durationHours);
      patchBasket({ items: initial });
    }
  }, [store.status, basket.items.length, basket.profile, basket.attendees, basket.durationHours, patchBasket]);

  const currentTotal = basketTotal(basket.items, basket.priceBase);

  // Acciones de la canasta
  const handleRegenerate = (profile: BasketProfile) => {
    audioEffects.playPop();
    const regenerated = generateBasket(profile, basket.attendees, basket.durationHours);
    patchBasket({ profile, items: regenerated });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    audioEffects.playTick();
    const updated = basket.items
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as BasketItem[];
    patchBasket({ items: updated });
  };

  const handleRemoveItem = (itemId: string) => {
    audioEffects.playPop();
    const updated = basket.items.filter((item) => item.id !== itemId);
    patchBasket({ items: updated });
  };

  const handleAddCatalogItem = (catalogItem: CatalogItem, qty: number) => {
    audioEffects.playSuccessChime();
    const existing = basket.items.find((i) => i.id === catalogItem.id);
    if (existing) {
      handleUpdateQty(catalogItem.id, qty);
    } else {
      const newItem: BasketItem = {
        id: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        quantity: Math.max(1, qty),
        unit: "un",
        prices: catalogItem.prices,
      };
      patchBasket({ items: [...basket.items, newItem] });
    }
  };

  const handleAddCustomItem = (customItem: BasketItem) => {
    audioEffects.playSuccessChime();
    patchBasket({ items: [...basket.items, customItem] });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-night-950 via-indigo-950/60 to-night-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Armar Canasta de Carrete</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Planificador & Cotizador Dinámico
          </h1>
          <p className="text-xs text-slate-400">
            {code !== "SOLO" ? `Vinculado al Carrete ${code}` : "Modo Solo / Planificador libre"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="min-h-[48px] px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Sumar Producto</span>
        </button>
      </div>

      {/* Barra de Parámetros Globales: Asistentes, Duración, Presupuesto */}
      <div className="p-4 rounded-3xl bg-night-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Asistentes */}
        <div className="p-3 rounded-2xl bg-night-950 border border-night-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Personas</span>
              <span className="text-sm font-black text-white">{basket.attendees} invitados</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => patchBasket({ attendees: Math.max(2, basket.attendees - 1) })}
              className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => patchBasket({ attendees: basket.attendees + 1 })}
              className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Duración */}
        <div className="p-3 rounded-2xl bg-night-950 border border-night-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Duración</span>
              <span className="text-sm font-black text-white">{basket.durationHours} horas</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => patchBasket({ durationHours: Math.max(1, basket.durationHours - 1) })}
              className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => patchBasket({ durationHours: basket.durationHours + 1 })}
              className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Presupuesto */}
        <div className="p-3 rounded-2xl bg-night-950 border border-night-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Presupuesto</span>
              <span className="text-sm font-black text-white font-mono">
                ${basket.budget.toLocaleString("es-CL")} CLP
              </span>
            </div>
          </div>
          <select
            value={basket.budget}
            onChange={(e) => patchBasket({ budget: Number(e.target.value) })}
            className="px-2 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-white border border-slate-700 outline-none"
          >
            <option value={30000}>$30.000</option>
            <option value={50000}>$50.000</option>
            <option value={75000}>$75.000</option>
            <option value={100000}>$100.000</option>
            <option value={150000}>$150.000</option>
            <option value={200000}>$200.000</option>
          </select>
        </div>
      </div>

      {/* Selector de Perfil Preset (Ahorro, Clásica, Mocktail) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">
          Plantillas Inteligentes de Canasta:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: "ahorro", label: "Ahorro / Mechón", desc: "Pisco 35° 1L + Cervezas Cristal + Hielo + Snacks" },
            { id: "clasica", label: "Clásica / Premium", desc: "Mistral 40° + Stolichnaya + Beefeater + Royal Guard" },
            { id: "mocktail", label: "Mocktail / Sin Alcohol", desc: "Tónicas, Ginger Ale, Néctares, Granadina y Cítricos" },
          ].map((prof) => (
            <button
              key={prof.id}
              type="button"
              onClick={() => handleRegenerate(prof.id as BasketProfile)}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                basket.profile === prof.id
                  ? "bg-indigo-950/70 border-indigo-500 shadow-md"
                  : "bg-night-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white">{prof.label}</span>
                {basket.profile === prof.id && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Activa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{prof.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Estado del Presupuesto en Tiempo Real */}
      <BudgetStatus
        budget={basket.budget}
        total={currentTotal}
        attendees={basket.attendees}
      />

      {/* Lista Dinámica de Productos en la Canasta */}
      <div className="p-5 rounded-3xl bg-night-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-night-800 pb-3">
          <div>
            <h3 className="font-black text-base text-white">
              Productos en la Canasta ({basket.items.length})
            </h3>
            <p className="text-xs text-slate-400">
              Precios calculados con base en:{" "}
              <strong className="text-indigo-400">{STORE_LABEL[basket.priceBase]}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {basket.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <p className="text-sm">La canasta está vacía actualmente.</p>
            <button
              type="button"
              onClick={() => handleRegenerate("clasica")}
              className="min-h-[48px] px-5 rounded-2xl bg-indigo-600 text-white font-bold text-xs"
            >
              Cargar canasta clásica sugerida
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {basket.items.map((item) => {
              const uPrice = unitPrice(item, basket.priceBase);
              const subtotal = uPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-night-950 border border-night-800 hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                      {item.custom && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      ${uPrice.toLocaleString("es-CL")} c/u · Subtotal: ${subtotal.toLocaleString("es-CL")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-night-850">
                    {/* Botones de cantidad */}
                    <div className="flex items-center gap-2 bg-night-900 px-2 py-1 rounded-xl border border-night-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 active:scale-95"
                        title="Restar 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-black text-sm text-white w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 active:scale-95"
                        title="Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparador Multitienda */}
      <MultiStoreCompare
        items={basket.items}
        selectedBase={basket.priceBase}
        onSelectBase={(base) => patchBasket({ priceBase: base })}
      />

      {/* Exportador de texto y Delivery */}
      <DeliveryTextExporter items={basket.items} priceBase={basket.priceBase} />

      {/* Modal de Búsqueda y Creación de Producto */}
      <SearchableProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddCatalogItem={handleAddCatalogItem}
        onAddCustomItem={handleAddCustomItem}
      />
    </div>
  );
}
