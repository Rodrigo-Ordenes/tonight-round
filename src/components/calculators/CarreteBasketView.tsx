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
  type CatalogItem,
} from "@/lib/basket";
import type { BasketItem, BasketProfile, PriceBase } from "@/lib/carreteState";
import BudgetStatus from "./BudgetStatus";
import SearchableProductModal from "./SearchableProductModal";
import MultiStoreCompare from "./MultiStoreCompare";
import DeliveryTextExporter from "./DeliveryTextExporter";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";

const DRINK_OPTIONS = [
  {
    id: "mix",
    name: "Mix Variado",
    desc: "Pisco + Destilado + Cerveza",
    emoji: "🍸",
    badge: "Equilibrado",
  },
  {
    id: "pisco",
    name: "Piscola",
    desc: "Pisco 35° / 40° + Coca Cola",
    emoji: "🥃",
    badge: "Clásico Chileno",
  },
  {
    id: "cerveza",
    name: "Cervezas",
    desc: "Báltica / Becker / Cristal / Royal",
    emoji: "🍺",
    badge: "Rendidor",
  },
  {
    id: "vino",
    name: "Vino & Pipeño",
    desc: "Gato caja 2L / Botellón / Terremoto",
    emoji: "🍷",
    badge: "Económico",
  },
  {
    id: "gin",
    name: "Gin Tonic",
    desc: "Beefeater / Bombay + Tónica Nordic",
    emoji: "🍸",
    badge: "Refrescante",
  },
  {
    id: "vodka",
    name: "Vodka",
    desc: "Stolichnaya + Sprite / Jugos",
    emoji: "🍹",
    badge: "Frutal",
  },
  {
    id: "whisky",
    name: "Whisky",
    desc: "Sandy Mac / Ballantine's + Ginger",
    emoji: "🥃",
    badge: "Carretero",
  },
  {
    id: "ron",
    name: "Ron",
    desc: "Havana Especial + Bebida Cola",
    emoji: "🍹",
    badge: "Tropical",
  },
  {
    id: "tequila",
    name: "Tequila",
    desc: "José Cuervo + Limones + Sal",
    emoji: "🌵",
    badge: "Shots",
  },
  {
    id: "mocktail",
    name: "Sin Alcohol",
    desc: "Tónicas, Jugos, Ginger Ale, Granadina",
    emoji: "🥤",
    badge: "0% Alcohol",
  },
] as const;

const BUDGET_PRESETS = [
  { label: "$15.000", value: 15000, desc: "Apretado" },
  { label: "$30.000", value: 30000, desc: "Mechón" },
  { label: "$50.000", value: 50000, desc: "Estándar" },
  { label: "$80.000", value: 80000, desc: "Carretazo" },
  { label: "$120.000", value: 120000, desc: "VIP" },
];

export default function CarreteBasketView() {
  const { code } = useActiveCode();
  const { locale, formatCurrency } = useLocale();
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

  // Seleccionar qué quieren tomar hoy
  const handleSelectDrink = (drinkId: string) => {
    audioEffects.playTick();
    const currentBudget = Number(customBudgetInput) || basket.budget || 50000;
    const regenerated = generateBasket(
      basket.profile,
      basket.attendees,
      basket.durationHours,
      currentBudget,
      drinkId,
      basket.priceBase
    );
    patchBasket({
      targetDrink: drinkId,
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
            <span>Armar Canasta de {locale.terminology.partyName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Planificador & Cotizador Dinámico
          </h1>
          <p className="text-xs text-slate-400">
            {code !== "SOLO"
              ? `Vinculado a ${locale.terminology.partyName} ${code}`
              : "Modo Solo / Planificador libre"}
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

      {/* Panel de Parámetros: Personas, Horas y Presupuesto Manual */}
      <div className="p-5 rounded-3xl bg-night-900/90 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Asistentes */}
          <div className="p-3.5 rounded-2xl bg-night-950 border border-night-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Invitados
                </span>
                <span className="text-sm font-black text-white">
                  {basket.attendees} personas
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(2, basket.attendees - 1);
                  patchBasket({ attendees: val });
                  const regenerated = generateBasket(
                    basket.profile,
                    val,
                    basket.durationHours,
                    basket.budget,
                    activeDrink,
                    basket.priceBase
                  );
                  patchBasket({ items: regenerated });
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold active:scale-95"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = basket.attendees + 1;
                  patchBasket({ attendees: val });
                  const regenerated = generateBasket(
                    basket.profile,
                    val,
                    basket.durationHours,
                    basket.budget,
                    activeDrink,
                    basket.priceBase
                  );
                  patchBasket({ items: regenerated });
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Duración */}
          <div className="p-3.5 rounded-2xl bg-night-950 border border-night-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Duración
                </span>
                <span className="text-sm font-black text-white">
                  {basket.durationHours} horas
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(1, basket.durationHours - 1);
                  patchBasket({ durationHours: val });
                  const regenerated = generateBasket(
                    basket.profile,
                    basket.attendees,
                    val,
                    basket.budget,
                    activeDrink,
                    basket.priceBase
                  );
                  patchBasket({ items: regenerated });
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold active:scale-95"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = basket.durationHours + 1;
                  patchBasket({ durationHours: val });
                  const regenerated = generateBasket(
                    basket.profile,
                    basket.attendees,
                    val,
                    basket.budget,
                    activeDrink,
                    basket.priceBase
                  );
                  patchBasket({ items: regenerated });
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 font-bold active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Presupuesto Manual Editable */}
          <div className="p-3.5 rounded-2xl bg-night-950 border border-night-800 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Presupuesto Total
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                ~${perPersonBudget.toLocaleString("es-CL")}/persona
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-400">$</span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={customBudgetInput}
                onChange={(e) => setCustomBudgetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyBudget();
                }}
                placeholder="Ej: 45000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-mono font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleApplyBudget()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shrink-0 active:scale-95 transition-all"
                title="Aplicar presupuesto a la canasta"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Botones de Presupuesto Rápido (Presets) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-night-850">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Presupuestos rápidos:
          </span>
          {BUDGET_PRESETS.map((p) => {
            const isCurrent = basket.budget === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleApplyBudget(p.value)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  isCurrent
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-night-950/80 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[9px] text-slate-400 ml-1">({p.desc})</span>
              </button>
            );
          })}
        </div>
      </div>

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

        {/* Grilla de tragos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
          {DRINK_OPTIONS.map((drink) => {
            const isSelected = activeDrink === drink.id;
            return (
              <button
                key={drink.id}
                type="button"
                onClick={() => handleSelectDrink(drink.id)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.97] flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-950/80 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
                    : "bg-night-950/70 border-night-800 hover:border-slate-700 hover:bg-night-950 text-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{drink.emoji}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-xs text-white mt-1.5">{drink.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                    {drink.desc}
                  </p>
                </div>

                <div className="mt-2 pt-1 border-t border-night-850">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider block ${
                      isSelected ? "text-indigo-300" : "text-slate-500"
                    }`}
                  >
                    {drink.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Banner de Priorización y Opciones Económicas */}
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
            perPersonBudget < 5000
              ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
              : perPersonBudget < 8000
              ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-200"
              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
          }`}
        >
          {perPersonBudget < 5000 ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="font-bold">
              {perPersonBudget < 5000
                ? "💡 Presupuesto ultra apretado: Activamos opciones de alto rendimiento"
                : perPersonBudget < 8000
                ? "⚡ Presupuesto universitario / mechón balanceado"
                : "✨ Presupuesto holgado y completo"}
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {perPersonBudget < 5000
                ? "Priorizamos litros de alcohol con alternativas rendidoras (como Vino Gato Exportación en caja 2L o Cerveza Báltica 6-pack) y postergamos snacks/vasos para garantizar tragos suficientes para todos."
                : perPersonBudget < 8000
                ? "La canasta asegura destilados o cervezas de buen rendimiento junto a mezcladores esenciales y hielo, manteniendo el gasto bajo control."
                : "Tu presupuesto cubre cómodamente destilados premium, mezcladores de calidad, hielo, agua de hidratación y picoteo para el grupo."}
            </p>
          </div>
        </div>
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
