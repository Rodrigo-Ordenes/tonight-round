"use client";

import React, { useState, useMemo } from "react";
import { 
  Flame, 
  Droplets, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Calculator,
  Wine,
  Sparkles
} from "lucide-react";
import { audioEffects } from "@/components/ui/AudioEffects";

export default function PiscolometerSlider() {
  const [piscoPercentage, setPiscoPercentage] = useState<number>(30); // 70/30 default
  const [bottlesOfPisco, setBottlesOfPisco] = useState<number>(3);
  const [piscoBottleSize, setPiscoBottleSize] = useState<number>(750); // ml

  const handleSliderChange = (val: number) => {
    audioEffects.playTick(500 + val * 5, 0.02);
    setPiscoPercentage(val);
  };

  // Interpretation of ratio
  const ratioDetails = useMemo(() => {
    const colaPercentage = 100 - piscoPercentage;

    if (piscoPercentage <= 20) {
      return {
        name: "Piscola Suave / Canchera (80/20)",
        tag: "Para durar toda la noche",
        color: "text-emerald-400",
        border: "border-emerald-500/40",
        bg: "bg-emerald-950/20",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        desc: "Excelente para carretes largos de 6+ horas. Mantiene la conversación sin riesgo de apagón temprano.",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        alertLevel: "safe",
      };
    } else if (piscoPercentage <= 35) {
      return {
        name: "Piscola Clásica (70/30)",
        tag: "La Proporción Sagrada",
        color: "text-indigo-400",
        border: "border-indigo-500/40",
        bg: "bg-indigo-950/20",
        badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        desc: "Equilibrio perfecto entre el destilado y el caramelo de la cola. Respeta el sabor del pisco sin quemar el paladar.",
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        alertLevel: "classic",
      };
    } else if (piscoPercentage <= 45) {
      return {
        name: "Piscola Fuerte (60/40)",
        tag: "Previa Corta / Intensiva",
        color: "text-amber-400",
        border: "border-amber-500/40",
        bg: "bg-amber-950/20",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        desc: "Sabor alcohólico marcado. Sube rápido el BAC. Si vas a salir a discoteca en 1 hora, anda con cuidado.",
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        alertLevel: "strong",
      };
    } else if (piscoPercentage <= 55) {
      return {
        name: "Piscola Caballo (50/50)",
        tag: "Peligro: Vas al suelo",
        color: "text-red-400",
        border: "border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.35)]",
        bg: "bg-red-950/30",
        badge: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse",
        desc: "Alerta Roja: Mitad pisco y mitad bebida. A este ritmo el carrete termina antes de las 01:00 AM con lagunas mentales.",
        icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
        alertLevel: "danger",
      };
    } else {
      return {
        name: "Pisco Pintado con Coca-Cola (>60%)",
        tag: "Demolición Inminente",
        color: "text-red-500",
        border: "border-red-600 bg-red-950/50 shadow-[0_0_35px_rgba(239,68,68,0.5)] animate-pulse",
        bg: "bg-red-950/40",
        badge: "bg-red-600 text-white border-red-500 font-black",
        desc: "Esto no es una piscola, es un vaso de pisco con colorante. ¿Quién te hizo tanto daño?",
        icon: <ShieldAlert className="w-5 h-5 text-white" />,
        alertLevel: "extreme",
      };
    }
  }, [piscoPercentage]);

  // Logistics Cola calculator
  const colaNeeded = useMemo(() => {
    // Total ml of pisco available
    const totalPiscoMl = bottlesOfPisco * piscoBottleSize;
    // Ratio of cola to pisco
    const piscoRatio = piscoPercentage / 100;
    const colaRatio = (100 - piscoPercentage) / 100;

    const totalColaMl = piscoRatio > 0 ? (totalPiscoMl / piscoRatio) * colaRatio : 0;
    const totalColaLiters = totalColaMl / 1000;

    // How many 3L bottles or 2.5L bottles?
    const bottles3L = Math.ceil(totalColaLiters / 3);
    const bottles25L = Math.ceil(totalColaLiters / 2.5);

    return {
      liters: totalColaLiters.toFixed(1),
      bottles3L,
      bottles25L,
    };
  }, [bottlesOfPisco, piscoBottleSize, piscoPercentage]);

  const [glassType, setGlassType] = useState<"standard" | "large" | "plastic">("standard");

  // Glass useful liquid volume after filling with generous ice cubes (standard bar science)
  const usefulVolumeMl = useMemo(() => {
    switch (glassType) {
      case "large":
        return 260; // 400cc glass with ice
      case "plastic":
        return 160; // 250cc plastic cup with ice
      case "standard":
      default:
        return 220; // 350cc piscolero glass with ice
    }
  }, [glassType]);

  // Exact yields per glass and per bottle
  const yieldStats = useMemo(() => {
    const piscoRatio = piscoPercentage / 100;
    const colaRatio = (100 - piscoPercentage) / 100;

    const piscoCcPerGlass = Math.max(1, Math.round(usefulVolumeMl * piscoRatio));
    const colaCcPerGlass = Math.max(1, Math.round(usefulVolumeMl * colaRatio));

    // Yield from 1 bottle of pisco
    const piscolasPerPiscoBottle = Math.floor(piscoBottleSize / piscoCcPerGlass);

    // Yield from 1 bottle of cola
    const piscolasPerCola3L = Math.floor(3000 / colaCcPerGlass);
    const piscolasPerCola25L = Math.floor(2500 / colaCcPerGlass);
    const piscolasPerCola15L = Math.floor(1500 / colaCcPerGlass);

    // Total yield for all selected bottles of pisco
    const totalPiscoAvailableMl = bottlesOfPisco * piscoBottleSize;
    const totalPiscolas = Math.floor(totalPiscoAvailableMl / piscoCcPerGlass);

    const totalColaLitrosNeeded = Number(((totalPiscolas * colaCcPerGlass) / 1000).toFixed(1));
    const bottles3LNeeded = Math.ceil(totalColaLitrosNeeded / 3);
    const bottles25LNeeded = Math.ceil(totalColaLitrosNeeded / 2.5);

    // Attendees coverage
    const peopleAt3Drinks = Math.max(1, Math.floor(totalPiscolas / 3));
    const peopleAt4Drinks = Math.max(1, Math.floor(totalPiscolas / 4));

    return {
      piscoCcPerGlass,
      colaCcPerGlass,
      piscolasPerPiscoBottle,
      piscolasPerCola3L,
      piscolasPerCola25L,
      piscolasPerCola15L,
      totalPiscolas,
      totalColaLitrosNeeded,
      bottles3LNeeded,
      bottles25LNeeded,
      peopleAt3Drinks,
      peopleAt4Drinks,
    };
  }, [piscoPercentage, usefulVolumeMl, piscoBottleSize, bottlesOfPisco]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-night-900 to-indigo-950/80 p-5 rounded-3xl border border-indigo-500/20 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>El Piscolómetro</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Calibrador 70/30
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ajusta la proporción del vaso, calcula cuántas piscolas salen por botella y optimiza la compra
            </p>
          </div>
        </div>
      </div>

      {/* Main Glass Visualizer & Slider */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Interactive Graphic Glass (5 cols) */}
        <div className="md:col-span-5 glass-panel p-6 rounded-3xl bg-night-950/80 border border-white/10 flex flex-col items-center justify-center">
          <div className="w-36 h-56 rounded-b-3xl rounded-t-lg border-4 border-slate-500/80 bg-slate-900/60 p-1 flex flex-col-reverse overflow-hidden shadow-2xl relative">
            {/* Ice Cubes inside */}
            <div className="absolute bottom-6 left-3 w-8 h-8 rounded-lg bg-white/25 border border-white/40 rotate-12 backdrop-blur-sm z-10 pointer-events-none" />
            <div className="absolute bottom-16 right-3 w-9 h-9 rounded-lg bg-white/25 border border-white/40 -rotate-12 backdrop-blur-sm z-10 pointer-events-none" />
            <div className="absolute top-12 left-6 w-8 h-8 rounded-lg bg-white/25 border border-white/40 rotate-45 backdrop-blur-sm z-10 pointer-events-none" />

            {/* Pisco Bottom Layer */}
            <div
              className="w-full bg-amber-400/80 transition-all duration-300 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner"
              style={{ height: `${piscoPercentage}%` }}
            >
              <span>{piscoPercentage}% Pisco</span>
            </div>

            {/* Coca-Cola Top Layer */}
            <div
              className="w-full bg-[#381608] transition-all duration-300 flex items-center justify-center text-[10px] font-black text-amber-200 shadow-inner"
              style={{ height: `${100 - piscoPercentage}%` }}
            >
              <span>{100 - piscoPercentage}% Cola</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-2xl font-black text-white block">
              {100 - piscoPercentage} / {piscoPercentage}
            </span>
            <span className="text-[11px] text-slate-400">
              ({100 - piscoPercentage}% Bebida Cola • {piscoPercentage}% Pisco)
            </span>
          </div>
        </div>

        {/* Right: Slider & Preset Buttons (7 cols) */}
        <div className="md:col-span-7 glass-panel p-6 rounded-3xl bg-night-950/80 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                Ajustar Proporción del Vaso:
              </label>
              <span className="text-xs font-bold text-amber-400">
                {piscoPercentage}% Pisco
              </span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={piscoPercentage}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-3 bg-night-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-4"
            />

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "80/20", val: 20 },
                { label: "70/30", val: 30 },
                { label: "60/40", val: 40 },
                { label: "50/50", val: 50 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleSliderChange(p.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                    piscoPercentage === p.val
                      ? "bg-indigo-600 text-white shadow-glow"
                      : "bg-night-900 border border-night-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Ratio Interpretation Card */}
            <div className={`p-4 rounded-2xl border transition-all ${ratioDetails.border} ${ratioDetails.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                {ratioDetails.icon}
                <h4 className="text-sm font-black text-white">{ratioDetails.name}</h4>
              </div>
              <span className={`text-[11px] font-bold block mb-1.5 ${ratioDetails.color}`}>
                {ratioDetails.tag}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{ratioDetails.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: ¿CUÁNTAS SALEN DE CADA UNA? */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-night-950 via-night-900 to-indigo-950/40 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                ¿Cuántas piscolas salen de cada una? (Rendimiento Real)
              </h3>
              <p className="text-[11px] text-slate-400">
                Calculado con abundante hielo y tu proporción actual de {100 - piscoPercentage}/{piscoPercentage}
              </p>
            </div>
          </div>

          {/* Glass format selector */}
          <div className="flex items-center gap-1.5 bg-night-900 p-1 rounded-2xl border border-night-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGlassType("standard")}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                glassType === "standard"
                  ? "bg-carrete-primary text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Vaso Piscolero (350cc)
            </button>
            <button
              type="button"
              onClick={() => setGlassType("large")}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                glassType === "large"
                  ? "bg-carrete-primary text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Vaso Largo (400cc)
            </button>
            <button
              type="button"
              onClick={() => setGlassType("plastic")}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                glassType === "plastic"
                  ? "bg-carrete-primary text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Vaso Plástico (250cc)
            </button>
          </div>
        </div>

        {/* 3 Prominent Yield Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Pisco Bottle Yield */}
          <div className="p-4 rounded-2xl bg-night-900/90 border border-amber-500/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>🥃 1 Botella de Pisco ({piscoBottleSize}cc)</span>
                </span>
                <span className="text-[10px] text-slate-400">~{yieldStats.piscoCcPerGlass}cc c/vaso</span>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-black text-amber-400 block">
                  ~{yieldStats.piscolasPerPiscoBottle} piscolas
                </span>
                <span className="text-[11px] text-slate-300">
                  salen de esta botella en proporción {100 - piscoPercentage}/{piscoPercentage}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-night-800 text-[10px] text-slate-400">
              💡 {piscoBottleSize === 750 ? "Si fuera botellón de 1L saldrían ~" + Math.floor(1000 / yieldStats.piscoCcPerGlass) + " piscolas." : "Formato botellón de 1 litro."}
            </div>
          </div>

          {/* Card 2: Coca-Cola Yield */}
          <div className="p-4 rounded-2xl bg-night-900/90 border border-indigo-500/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <span>🥤 1 Botella de Cola (3L / 2.5L)</span>
                </span>
                <span className="text-[10px] text-slate-400">~{yieldStats.colaCcPerGlass}cc c/vaso</span>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-black text-indigo-400 block">
                  ~{yieldStats.piscolasPerCola3L} piscolas
                </span>
                <span className="text-[11px] text-slate-300">
                  rinden con 1 botella de 3L (~{yieldStats.piscolasPerCola25L} si es de 2.5L)
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-night-800 text-[10px] text-slate-400">
              💡 Con 1 retornable de 2L rinden ~{Math.floor(2000 / yieldStats.colaCcPerGlass)} piscolas.
            </div>
          </div>

          {/* Card 3: Total Carrete Coverage */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-emerald-500/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <span>📦 Total para tus {bottlesOfPisco} botellas</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Autonomía</span>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-black text-emerald-400 block">
                  ~{yieldStats.totalPiscolas} piscolas en total
                </span>
                <span className="text-[11px] text-slate-200 font-medium">
                  Abastece a <strong className="text-white">{yieldStats.peopleAt3Drinks} personas</strong> (3 piscolas c/u) o a <strong className="text-white">{yieldStats.peopleAt4Drinks} personas</strong> (4 c/u)
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-night-800 text-[10px] text-emerald-300/80 font-semibold">
              Necesitas comprar ~{yieldStats.totalColaLitrosNeeded}L de bebida cola ({yieldStats.bottles3LNeeded} de 3L).
            </div>
          </div>
        </div>
      </div>

      {/* Logistics Calculator: How many Cokes to buy? */}
      <div className="glass-panel p-5 rounded-3xl bg-night-950/80 border border-indigo-500/20 shadow-glow">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-black text-white">
            Calculadora de Logística: Configura tu compra de Pisco
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Botellas de Pisco disponibles
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBottlesOfPisco(Math.max(1, bottlesOfPisco - 1))}
                className="w-10 h-10 rounded-xl bg-night-900 border border-night-700 text-white font-bold flex items-center justify-center hover:bg-night-850"
              >
                -
              </button>
              <span className="flex-1 text-center font-extrabold text-white text-base">
                {bottlesOfPisco} {bottlesOfPisco === 1 ? "botella" : "botellas"}
              </span>
              <button
                type="button"
                onClick={() => setBottlesOfPisco(bottlesOfPisco + 1)}
                className="w-10 h-10 rounded-xl bg-night-900 border border-night-700 text-white font-bold flex items-center justify-center hover:bg-night-850"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Tamaño de botella
            </label>
            <select
              value={piscoBottleSize}
              onChange={(e) => setPiscoBottleSize(Number(e.target.value))}
              className="w-full min-h-[40px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none font-bold"
            >
              <option value={750}>750 ml (Estándar)</option>
              <option value={1000}>1.0 Litro (Botellón)</option>
            </select>
          </div>

          {/* Result Display */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl flex flex-col justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-300">
              Bebida cola necesaria recomendada:
            </span>
            <span className="text-xl font-black text-white">
              ~{yieldStats.totalColaLitrosNeeded} Litros
            </span>
            <span className="text-[10px] text-slate-400">
              ({yieldStats.bottles3LNeeded} de 3L ó {yieldStats.bottles25LNeeded} de 2.5L)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
