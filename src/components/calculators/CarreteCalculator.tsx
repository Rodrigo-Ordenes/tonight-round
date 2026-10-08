"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Clock, 
  Wine, 
  Beer, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  Droplets,
  Package
} from "lucide-react";
import clLocale from "@/config/locales/cl";
import pricesData from "@/data/prices_cl.json";
import WhatsAppShareButton from "@/components/ui/WhatsAppShareButton";

type PreferenceType = "both" | "spirits_only" | "beer_only" | "non_alcoholic";

interface ItemRecommendation {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes: string;
}

export default function CarreteCalculator() {
  const [attendees, setAttendees] = useState<number>(8);
  const [durationHours, setDurationHours] = useState<number>(5);
  const [preference, setPreference] = useState<PreferenceType>("both");
  const [budgetInput, setBudgetInput] = useState<string>("");

  // Map prices catalog for quick lookups
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of pricesData.items) {
      const priceVal = (item as any).prices ? (item as any).prices.lider : (item as any).price || 4990;
      map.set(item.id, priceVal);
    }
    return map;
  }, []);

  // Calculation engine based on specification ratios
  const calculation = useMemo(() => {
    const safeAttendees = Math.max(2, Math.min(50, attendees || 2));
    const safeDuration = Math.max(2, Math.min(10, durationHours || 2));

    // Fractions of consumption based on preference
    let spiritConsumers = 0;
    let beerConsumers = 0;

    switch (preference) {
      case "spirits_only":
        spiritConsumers = safeAttendees;
        beerConsumers = 0;
        break;
      case "beer_only":
        spiritConsumers = 0;
        beerConsumers = safeAttendees;
        break;
      case "both":
        spiritConsumers = Math.round(safeAttendees * 0.7); // 70% toman destilados
        beerConsumers = Math.round(safeAttendees * 0.75); // 75% toman cerveza
        break;
      case "non_alcoholic":
        spiritConsumers = 0;
        beerConsumers = 0;
        break;
    }

    const items: ItemRecommendation[] = [];

    // 1. Destilados (60 ml por hora por persona consumidora)
    if (spiritConsumers > 0) {
      const totalSpiritsMl = spiritConsumers * safeDuration * 60;
      const bottleCount750 = Math.max(1, Math.ceil(totalSpiritsMl / 750));
      const piscoPrice = priceMap.get("pisco_alto_35_750") || 6990;

      items.push({
        id: "pisco_alto_35_750",
        name: "Pisco 35° / Destilado (750cc)",
        category: "destilados",
        quantity: bottleCount750,
        unit: "botellas",
        unitPrice: piscoPrice,
        totalPrice: bottleCount750 * piscoPrice,
        notes: `~${Math.round(totalSpiritsMl / 60)} piscolas estimadas (${bottleCount750 * 750}cc total)`,
      });

      // 2. Mezcladores (180 ml por cada trago de 60 ml -> proporción 3:1)
      const totalMixerMl = totalSpiritsMl * 3;
      const mixerBottles2500 = Math.max(1, Math.ceil(totalMixerMl / 2500));
      const colaPrice = priceMap.get("bebida_coca_cola_2500") || 2490;

      items.push({
        id: "bebida_coca_cola_2500",
        name: "Bebida Cola / Mezclador (2.5L)",
        category: "mezcladores",
        quantity: mixerBottles2500,
        unit: "botellas 2.5L",
        unitPrice: colaPrice,
        totalPrice: mixerBottles2500 * colaPrice,
        notes: `Rinde ~${Math.round((mixerBottles2500 * 2500) / 180)} vasos de mezcla 3:1`,
      });
    }

    // 3. Cerveza (1 a 1.25 latas por hora por persona)
    if (beerConsumers > 0) {
      const totalCans = Math.ceil(beerConsumers * safeDuration * 1.2);
      // Optimize into 24-packs and 6-packs
      const pack24Count = Math.floor(totalCans / 24);
      const remainingCans = totalCans % 24;
      const pack6Count = Math.ceil(remainingCans / 6);

      const price24 = priceMap.get("cerveza_royal_24pack") || 19990;
      const price6 = priceMap.get("cerveza_royal_6pack") || 5490;

      if (pack24Count > 0) {
        items.push({
          id: "cerveza_royal_24pack",
          name: "Cerveza Pack 24 Latas 350cc",
          category: "cervezas",
          quantity: pack24Count,
          unit: "packs 24",
          unitPrice: price24,
          totalPrice: pack24Count * price24,
          notes: `${pack24Count * 24} latas bien frías`,
        });
      }

      if (pack6Count > 0) {
        items.push({
          id: "cerveza_royal_6pack",
          name: "Cerveza Pack 6 Latas 350cc",
          category: "cervezas",
          quantity: pack6Count,
          unit: "packs 6",
          unitPrice: price6,
          totalPrice: pack6Count * price6,
          notes: `${pack6Count * 6} latas adicionales`,
        });
      }
    }

    // Si es sin alcohol: Jugos, bebidas y aguas
    if (preference === "non_alcoholic") {
      const sodaBottles = Math.max(2, Math.ceil((safeAttendees * safeDuration * 250) / 2500));
      const sodaPrice = priceMap.get("bebida_coca_cola_2500") || 2490;
      items.push({
        id: "bebida_coca_cola_2500",
        name: "Bebidas y Gaseosas Variadas (2.5L)",
        category: "mezcladores",
        quantity: sodaBottles,
        unit: "botellas 2.5L",
        unitPrice: sodaPrice,
        totalPrice: sodaBottles * sodaPrice,
        notes: `~${sodaBottles * 2.5} litros para hidratar al grupo`,
      });

      const juiceCount = Math.max(1, Math.ceil(safeAttendees / 4));
      const juicePrice = priceMap.get("jugo_watts_naranja_1500") || 1790;
      items.push({
        id: "jugo_watts_naranja_1500",
        name: "Jugo Néctar Natural (1.5L)",
        category: "mezcladores",
        quantity: juiceCount,
        unit: "botellas 1.5L",
        unitPrice: juicePrice,
        totalPrice: juiceCount * juicePrice,
        notes: "Néctar fresco y refrescante",
      });
    }

    // 4. Hielo (0.5 kg por persona si < 4h, 0.8 kg por persona si >= 4h)
    const iceKgPerPerson = safeDuration < 4 ? 0.5 : 0.8;
    const totalIceKg = Math.ceil(safeAttendees * iceKgPerPerson);
    // Use 4kg bags as primary, 2kg if small
    const ice4kgCount = Math.floor(totalIceKg / 4);
    const remainderIce = totalIceKg % 4;
    const ice2kgCount = remainderIce > 0 ? 1 : 0;

    const priceIce4 = priceMap.get("hielo_cubos_4kg") || 3290;
    const priceIce2 = priceMap.get("hielo_cubos_2kg") || 1890;

    if (ice4kgCount > 0) {
      items.push({
        id: "hielo_cubos_4kg",
        name: "Hielo en Cubos Bolsa 4kg",
        category: "insumos",
        quantity: ice4kgCount,
        unit: "bolsas 4kg",
        unitPrice: priceIce4,
        totalPrice: ice4kgCount * priceIce4,
        notes: `${ice4kgCount * 4} kg para enfriar y preparar`,
      });
    }

    if (ice2kgCount > 0) {
      items.push({
        id: "hielo_cubos_2kg",
        name: "Hielo en Cubos Bolsa 2kg",
        category: "insumos",
        quantity: ice2kgCount,
        unit: "bolsas 2kg",
        unitPrice: priceIce2,
        totalPrice: ice2kgCount * priceIce2,
        notes: "2 kg para completar la hielera",
      });
    }

    // 5. Hidratación responsable (500 ml de agua por persona)
    const waterBottles2L = Math.max(1, Math.ceil((safeAttendees * 500) / 2000));
    const waterPrice = priceMap.get("agua_vital_sin_gas_2000") || 1190;
    items.push({
      id: "agua_vital_sin_gas_2000",
      name: "Agua Mineral Sin Gas (2L) - Hidratación",
      category: "insumos",
      quantity: waterBottles2L,
      unit: "botellas 2L",
      unitPrice: waterPrice,
      totalPrice: waterBottles2L * waterPrice,
      notes: "Regla 1:1: vital para prevenir la deshidratación y la caña",
    });

    // 6. Vasos plásticos (pack 50u para grupos de hasta 20 personas)
    const cupPacks = Math.max(1, Math.ceil(safeAttendees / 20));
    const cupPrice = priceMap.get("vasos_plasticos_500cc_50u") || 3490;
    items.push({
      id: "vasos_plasticos_500cc_50u",
      name: "Vasos Desechables 500cc (Pack 50u)",
      category: "insumos",
      quantity: cupPacks,
      unit: "packs 50u",
      unitPrice: cupPrice,
      totalPrice: cupPacks * cupPrice,
      notes: "Vasos resistentes para piscola o tragos largos",
    });

    // 7. Snacks para picar (1 bolsa cada 3 personas)
    const snackBags = Math.max(1, Math.ceil(safeAttendees / 3.5));
    const snackPrice = priceMap.get("papas_lays_corte_americano_380g") || 3290;
    items.push({
      id: "papas_lays_corte_americano_380g",
      name: "Papas Fritas / Snacks (380g)",
      category: "insumos",
      quantity: snackBags,
      unit: "bolsas",
      unitPrice: snackPrice,
      totalPrice: snackBags * snackPrice,
      notes: "Para el picoteo y ayudar a retardar la absorción gástrica",
    });

    // Total general
    const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costPerPerson = Math.round(totalCost / safeAttendees);

    return {
      safeAttendees,
      safeDuration,
      items,
      totalCost,
      costPerPerson,
    };
  }, [attendees, durationHours, preference, priceMap]);

  // WhatsApp text formatting
  const whatsAppText = useMemo(() => {
    const pLabels: Record<PreferenceType, string> = {
      both: "Cerveza + Piscola/Destilados 🍻🥃",
      spirits_only: "Solo Piscola / Destilados 🥃",
      beer_only: "Solo Cervezas 🍺",
      non_alcoholic: "Sin alcohol / Refrescos 🥤✨",
    };

    let text = `🛒 *LISTA DE COMPRAS PARA EL CARRETE* 🔥\n`;
    text += `👥 *Asistentes:* ${calculation.safeAttendees} personas\n`;
    text += `⏱️ *Duración estimada:* ${calculation.safeDuration} horas\n`;
    text += `🎯 *Preferencia:* ${pLabels[preference]}\n\n`;
    text += `📋 *INSUMOS CALCULADOS:*\n`;

    calculation.items.forEach((item) => {
      text += `• ${item.quantity} ${item.unit} de *${item.name}* (~${clLocale.currency.format(
        item.totalPrice
      )})\n`;
    });

    text += `\n💰 *PRESUPUESTO ESTIMADO TOTAL:* ${clLocale.currency.format(
      calculation.totalCost
    )}\n`;
    text += `🎟️ *CUOTA ESTIMADA POR PERSONA:* ${clLocale.currency.format(
      calculation.costPerPerson
    )}\n\n`;
    text += `💡 _Calculado en base a precios retail de Chile con Tonight (Copiloto del Carrete) 🇨🇱_`;

    return text;
  }, [calculation, preference]);

  // Budget status comparison
  const budgetNumber = Number(budgetInput.replace(/\D/g, "")) || 0;
  const budgetDiff = budgetNumber > 0 ? budgetNumber - calculation.totalCost : null;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-night-900 to-night-850 p-5 rounded-3xl border border-indigo-500/20 shadow-glow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-carrete-primary/20 text-indigo-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Armar Carrete</h1>
            <p className="text-xs text-slate-400">
              Calculadora inteligente de insumos y presupuesto con precios de Chile
            </p>
          </div>
        </div>
      </div>

      {/* Control Inputs Card */}
      <div className="glass-panel p-5 rounded-3xl space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>1. Parámetros del Carrete</span>
        </h2>

        {/* Attendees Slider & Number */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-carrete-primary" />
              <span>Número de personas</span>
            </label>
            <span className="text-base font-extrabold text-white px-3 py-1 rounded-xl bg-night-800 border border-night-700">
              {attendees} personas
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={attendees}
            onChange={(e) => setAttendees(Number(e.target.value))}
            className="w-full h-2 bg-night-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>2 (íntimo)</span>
            <span>12 (media)</span>
            <span>25 (casa llena)</span>
            <span>40+ (masivo)</span>
          </div>
        </div>

        {/* Duration Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Duración estimada</span>
            </label>
            <span className="text-base font-extrabold text-white px-3 py-1 rounded-xl bg-night-800 border border-night-700">
              {durationHours} horas
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            className="w-full h-2 bg-night-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>2h (previa corta)</span>
            <span>5h (carrete normal)</span>
            <span>8h+ (hasta el amanecer)</span>
          </div>
        </div>

        {/* Preference Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ¿Qué se toma en el grupo?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: "both",
                label: "Cerveza + Destilados",
                desc: "El clásico chileno",
                icon: Wine,
              },
              {
                id: "spirits_only",
                label: "Solo Destilados",
                desc: "Piscola / Vodka / Gin",
                icon: Wine,
              },
              {
                id: "beer_only",
                label: "Solo Cerveza",
                desc: "Lagers e IPAs",
                icon: Beer,
              },
              {
                id: "non_alcoholic",
                label: "Sin Alcohol",
                desc: "Bebidas y jugos",
                icon: Droplets,
              },
            ].map((opt) => {
              const isSelected = preference === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreference(opt.id as PreferenceType)}
                  className={`p-3.5 rounded-2xl text-left border transition-all min-h-[58px] flex flex-col justify-center ${
                    isSelected
                      ? "bg-carrete-primary/20 border-carrete-primary text-white shadow-glow"
                      : "bg-night-850 border-night-700/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Available Budget */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Presupuesto total disponible (opcional)</span>
            </label>
            {budgetDiff !== null && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  budgetDiff >= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {budgetDiff >= 0
                  ? `Sobra ${clLocale.currency.format(budgetDiff)}`
                  : `Faltan ${clLocale.currency.format(Math.abs(budgetDiff))}`}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              $
            </span>
            <input
              type="text"
              placeholder="Ej: 50.000 (en lucas)"
              value={budgetInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setBudgetInput(raw ? Number(raw).toLocaleString("es-CL") : "");
              }}
              className="w-full min-h-[48px] bg-night-900 border border-night-700 rounded-2xl pl-8 pr-4 text-white text-sm focus:outline-none focus:border-carrete-primary"
            />
          </div>
        </div>
      </div>

      {/* Output Summary Card */}
      <div className="glass-panel p-5 rounded-3xl space-y-5 border-indigo-500/30">
        <div className="flex items-center justify-between border-b border-night-800 pb-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Cálculo de Cuota
            </span>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {clLocale.currency.format(calculation.costPerPerson)}
              <span className="text-xs font-normal text-slate-400 ml-1.5">/ persona</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Canasta
            </span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">
              {clLocale.currency.format(calculation.totalCost)}
            </div>
          </div>
        </div>

        {/* Itemized Basket */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>2. Desglose de Insumos Sugeridos</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {calculation.items.length} items
            </span>
          </h3>

          <div className="space-y-2">
            {calculation.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-night-900/90 border border-night-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-carrete-primary/20 text-indigo-300 font-bold text-xs shrink-0">
                      {item.quantity}x
                    </span>
                    <span className="font-semibold text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate pl-1">
                    {item.notes}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-100">
                    {clLocale.currency.format(item.totalPrice)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {clLocale.currency.format(item.unitPrice)} c/u
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible Hydration Tip */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
          <Droplets className="w-4 h-4 text-carrete-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Regla de oro:</strong> Se incluyeron 500ml de agua por persona. Alternar agua entre tragos no solo previene la caña del día siguiente, sino que mantiene prendido el carrete por más tiempo.
          </p>
        </div>

        {/* WhatsApp Sharing Block */}
        <div className="pt-2">
          <WhatsAppShareButton
            textToShare={whatsAppText}
            label="Compartir Canasta por WhatsApp"
          />
        </div>
      </div>
    </div>
  );
}
