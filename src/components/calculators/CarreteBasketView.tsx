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
  Check,
  AlertTriangle,
  Info,
  Wine,
  Beer,
} from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import {
  generateBasket,
  basketTotal,
  unitPrice,
  STORE_LABEL,
  DRINK_TYPES,
  parseDrinks,
  basketInsights,
  CATALOG,
  type CatalogItem,
} from "@/lib/basket";
import type { BasketItem, BasketProfile, PriceBase } from "@/lib/carreteState";
import BudgetPanel from "./BudgetPanel";
import BasketInsightsCard from "./BasketInsightsCard";
import PageHeader from "@/components/ui/PageHeader";
import SearchableProductModal from "./SearchableProductModal";
import MultiStoreCompare from "./MultiStoreCompare";
import DeliveryTextExporter from "./DeliveryTextExporter";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";



const BUDGET_PRESETS = [
  { label: "$15.000", value: 15000, desc: "Apretado" },
  { label: "$30.000", value: 30000, desc: "Mechón" },
  { label: "$50.000", value: 50000, desc: "Estándar" },
  { label: "$80.000", value: 80000, desc: "Carretazo" },
  { label: "$120.000", value: 120000, desc: "VIP" },
];

export default function CarreteBasketView() {
  const { code } = useActiveCode();
  const { locale, formatCurrency, country } = useLocale();
  const store = useCarreteStore(code);
  const { basket, patchBasket } = store;

  const [modalOpen, setModalOpen] = useState(false);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>(
    String(basket.budget || 50000)
  );

  // Sincronizar input cuando cambie el store
  useEffect(() => {
    if (basket.budget) {
      setCustomBudgetInput(String(basket.budget));
    }
  }, [basket.budget]);

  // Inicializar la canasta si está vacía
  useEffect(() => {
    if (store.status === "ready" && basket.items.length === 0) {
      const initial = generateBasket(
        basket.profile,
        basket.attendees,
        basket.durationHours,
        basket.budget,
        basket.targetDrink ?? "mix",
        basket.priceBase
      );
      patchBasket({ items: initial });
    }
  }, [
    store.status,
    basket.items.length,
    basket.profile,
    basket.attendees,
    basket.durationHours,
    basket.budget,
    basket.targetDrink,
    basket.priceBase,
    patchBasket,
  ]);

  const currentTotal = basketTotal(basket.items, basket.priceBase);
  const activeDrink = basket.targetDrink || "mix";
  const perPersonBudget = Math.round((basket.budget || 50000) / Math.max(1, basket.attendees));

  // Aplicar presupuesto manual
  const handleApplyBudget = (valToApply?: number) => {
    audioEffects.playPop();
    const newBudget = valToApply !== undefined ? valToApply : Number(customBudgetInput);
    if (!isNaN(newBudget) && newBudget > 0) {
      setCustomBudgetInput(String(newBudget));
      const regenerated = generateBasket(
        basket.profile,
        basket.attendees,
        basket.durationHours,
        newBudget,
        basket.targetDrink ?? "mix",
        basket.priceBase
      );
      patchBasket({ budget: newBudget, items: regenerated });
    }
  };

  // Seleccionar qué quieren tomar hoy (varios a la vez; "mix" = mezcla automática variada)
  const selectedDrinks = activeDrink === "mix" ? [] : activeDrink.split(",").filter(Boolean);
  const autoMix = parseDrinks("mix", perPersonBudget, basket.profile);
  const handleSelectDrink = (drinkId: string) => {
    audioEffects.playTick();
    const currentBudget = Number(customBudgetInput) || basket.budget || 50000;
    let next = "mix";
    if (drinkId !== "mix") {
      const set = new Set(selectedDrinks);
      if (set.has(drinkId)) set.delete(drinkId);
      else set.add(drinkId);
      next = set.size ? Array.from(set).join(",") : "mix";
    }
    const regenerated = generateBasket(
      basket.profile,
      basket.attendees,
      basket.durationHours,
      currentBudget,
      next,
      basket.priceBase
    );
    patchBasket({
      targetDrink: next,
      budget: currentBudget,
      items: regenerated,
    });
  };

  // Regenerar por perfil preset
  const handleRegenerate = (profile: BasketProfile) => {
    audioEffects.playPop();
    const currentBudget = Number(customBudgetInput) || basket.budget || 50000;
    const drink = profile === "mocktail" ? "mocktail" : basket.targetDrink ?? "mix";
    const regenerated = generateBasket(
      profile,
      basket.attendees,
      basket.durationHours,
      currentBudget,
      drink,
      basket.priceBase
    );
    patchBasket({
      profile,
      targetDrink: drink,
      budget: currentBudget,
      items: regenerated,
    });
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

  // Personas / horas / presupuesto: se recalcula la canasta al instante
  const handleParams = (p: { attendees?: number; hours?: number; budget?: number }) => {
    audioEffects.playTick();
    const attendees = p.attendees ?? basket.attendees;
    const hours = p.hours ?? basket.durationHours;
    const budget = p.budget ?? basket.budget;
    setCustomBudgetInput(String(budget));
    patchBasket({
      attendees,
      durationHours: hours,
      budget,
      items: generateBasket(basket.profile, attendees, hours, budget, activeDrink, basket.priceBase),
    });
  };

  const handleAddById = (id: string) => {
    const c = CATALOG.find((x) => x.id === id);
    if (c) handleAddCatalogItem(c, 1);
  };

  const insights = basketInsights(basket.items, basket.priceBase, basket.attendees, basket.durationHours, basket.budget || 50000, activeDrink, basket.profile);

  const handleAddCustomItem = (customItem: BasketItem) => {
    audioEffects.playSuccessChime();
    patchBasket({ items: [...basket.items, customItem] });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        eyebrow={code !== "SOLO" ? `Armar · sala ${code}` : "Armar · modo planificador"}
        title="La lista de compras"
        aside={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Sumar producto
          </button>
        }
      >
        Dinos cuántos son, cuánto tienen y qué quieren tomar: armamos la canasta con precios reales por tienda, priorizando
        el alcohol, el hielo y el agua.
      </PageHeader>

      <BudgetPanel
        attendees={basket.attendees}
        hours={basket.durationHours}
        budget={basket.budget || 50000}
        foreign={country !== "CL"}
        onChange={handleParams}
      />

      {/* SELECTOR: ¿QUÉ QUIEREN TOMAR HOY? (Quiero tomar... y tengo $X) */}
      <div className="p-5 rounded-3xl bg-night-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">
                🎯 ¿Qué quieren tomar hoy?
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Prioriza Alcohol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              El cotizador arma las cantidades exactas respetando tu presupuesto y <strong>priorizando el alcohol</strong> antes que vasos o picoteo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleApplyBudget()}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalcular canasta</span>
          </button>
        </div>

        {/* Grilla de tragos (selección múltiple) */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSelectDrink("mix")}
            aria-pressed={activeDrink === "mix"}
            className={`chip !min-h-[44px] !px-4 ${activeDrink === "mix" ? "chip-on" : ""}`}
          >
            ✨ Mezcla automática
          </button>
          {DRINK_TYPES.map((drink) => {
            const isSelected = selectedDrinks.includes(drink.id);
            const inAuto = activeDrink === "mix" && autoMix.includes(drink.id);
            return (
              <button
                key={drink.id}
                type="button"
                onClick={() => handleSelectDrink(drink.id)}
                aria-pressed={isSelected}
                title={drink.desc}
                className={`chip !min-h-[44px] !px-4 ${isSelected ? "chip-on" : inAuto ? "border-indigo-400/30 text-indigo-100" : ""}`}
              >
                <span className="text-base">{drink.emoji}</span> {drink.name}
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">
          {activeDrink === "mix"
            ? `Mezcla automática para este presupuesto: ${autoMix.map((d) => DRINK_TYPES.find((x) => x.id === d)?.name).join(" + ")}. Toca varios para elegir tú.`
            : `Repartimos el consumo entre ${selectedDrinks.length} ${selectedDrinks.length === 1 ? "tipo" : "tipos"} de trago, con sus mezcladores.`}
        </p>

      </div>

      {/* Plantillas Rápidas Adicionales */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">
          Plantillas Inteligentes de Referencia:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: "ahorro",
              label: "Ahorro / Mechón",
              desc: "Pisco 35° 1L + Cerveza Báltica / Cristal + Hielo",
            },
            {
              id: "clasica",
              label: "Clásica / Premium",
              desc: "Mistral 40° + Gin Beefeater + Cerveza Royal Guard",
            },
            {
              id: "mocktail",
              label: "Mocktail / Sin Alcohol",
              desc: "Tónicas, Ginger Ale, Néctares y Granadina",
            },
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

      <BasketInsightsCard insights={insights} hours={basket.durationHours} items={basket.items} code={code} onAdd={handleAddById} />

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
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
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
              className="min-h-[48px] px-5 rounded-2xl bg-indigo-600 text-white font-bold text-xs active:scale-95"
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
