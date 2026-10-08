"use client";

import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Scale, 
  Wine, 
  Beer, 
  Plus, 
  Minus, 
  ShieldAlert, 
  Info, 
  Droplets, 
  Sparkles,
  Car
} from "lucide-react";
import { useLocale } from "@/lib/useLocale";

interface DrinkCounter {
  id: string;
  name: string;
  abv: number; // Graduación alcohol (ej: 0.35)
  volumeMl: number; // Volumen por trago en ml (ej: 60ml destilado)
  gramsAlcohol: number; // ml * abv * 0.8
  count: number;
}

export default function EliminationTimeline() {
  const { locale } = useLocale();
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weightKg, setWeightKg] = useState<number>(75);
  const [hoursElapsed, setHoursElapsed] = useState<number>(2);
  const [ateFood, setAteFood] = useState<boolean>(true);

  // Drink items tracker
  const [drinks, setDrinks] = useState<DrinkCounter[]>([
    {
      id: "piscola_35",
      name: "Piscola 35° (vaso con 60cc pisco)",
      abv: 0.35,
      volumeMl: 60,
      gramsAlcohol: 60 * 0.35 * 0.8, // 16.8g alcohol puro
      count: 2,
    },
    {
      id: "cerveza_lata",
      name: "Lata Cerveza Lager (350cc, 5°)",
      abv: 0.05,
      volumeMl: 350,
      gramsAlcohol: 350 * 0.05 * 0.8, // 14g alcohol puro
      count: 1,
    },
    {
      id: "piscola_40",
      name: "Piscola 40° (vaso con 60cc)",
      abv: 0.40,
      volumeMl: 60,
      gramsAlcohol: 60 * 0.40 * 0.8, // 19.2g
      count: 0,
    },
    {
      id: "gin_tonic",
      name: "Gin Tonic (vaso con 50cc gin, 40°)",
      abv: 0.40,
      volumeMl: 50,
      gramsAlcohol: 50 * 0.40 * 0.8, // 16.0g
      count: 0,
    },
    {
      id: "copa_vino",
      name: "Copa de Vino (150cc, 13°)",
      abv: 0.13,
      volumeMl: 150,
      gramsAlcohol: 150 * 0.13 * 0.8, // 15.6g
      count: 0,
    },
    {
      id: "shot_destilado",
      name: "Shot Vodka/Tequila (45cc, 40°)",
      abv: 0.40,
      volumeMl: 45,
      gramsAlcohol: 45 * 0.40 * 0.8, // 14.4g
      count: 0,
    },
  ]);

  const updateDrinkCount = (id: string, delta: number) => {
    setDrinks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, count: Math.max(0, d.count + delta) } : d))
    );
  };

  // Widmark biological calculation
  const stats = useMemo(() => {
    const totalGramsAlcohol = drinks.reduce(
      (sum, d) => sum + d.gramsAlcohol * d.count,
      0
    );

    // Widmark r factor
    const r = gender === "male" ? 0.68 : 0.55;
    const weight = Math.max(40, Math.min(150, weightKg));

    // Peak theoretical BAC in g/l (or BAC % * 10)
    // Formula: BAC peak (g/l) = A (gramos) / (r * peso_kg)
    // If food was eaten, peak is smoothed and reduced by approx 15%
    const foodFactor = ateFood ? 0.85 : 1.0;
    const theoreticalPeakBac = totalGramsAlcohol > 0 ? (totalGramsAlcohol / (r * weight)) * foodFactor : 0;

    // Elimination rate: beta = 0.15 g/l por hora (conservador: 0.015% / h)
    const betaRatePerHour = 0.15; // g/l por hora

    // Current estimated BAC after T hours
    const eliminatedSoFar = hoursElapsed * betaRatePerHour;
    const currentBac = Math.max(0, theoreticalPeakBac - eliminatedSoFar);

    // Time to reach legal zero (< 0.01 g/l) and time to reach safe threshold (< 0.30 g/l)
    const hoursToCompleteElimination = currentBac > 0 ? currentBac / betaRatePerHour : 0;
    const hoursToUnder03 = currentBac > 0.3 ? (currentBac - 0.3) / betaRatePerHour : 0;

    // Legal status in Chile
    let legalClassification: {
      status: "sobrio" | "bajo_influencia" | "ebriedad";
      label: string;
      color: string;
      badgeColor: string;
      description: string;
    };

    if (currentBac >= 0.8) {
      legalClassification = {
        status: "ebriedad",
        label: "Estado de Ebriedad (≥ 0.8 g/l)",
        color: "text-red-400",
        badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
        description:
          "Sanción penal grave en Chile. Suspensión de 2 años hasta cancelación perpetua de licencia. Penas de cárcel con Ley Emilia si hay daños o lesiones.",
      };
    } else if (currentBac >= 0.3) {
      legalClassification = {
        status: "bajo_influencia",
        label: "Bajo la Influencia del Alcohol (0.3 a 0.79 g/l)",
        color: "text-amber-400",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        description:
          "Ilegal para conducir en Chile. Suspensión de licencia de 3 meses a 5 años y multas bajo la Ley de Tolerancia Cero.",
      };
    } else if (currentBac > 0.02) {
      legalClassification = {
        status: "sobrio",
        label: "Nivel Residual (< 0.3 g/l)",
        color: "text-indigo-400",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
        description:
          "Alcohol aún detectable en el organismo. La Ley Tolerancia Cero de Chile exige cero distracciones. Se recomienda no conducir hasta el día siguiente.",
      };
    } else {
      legalClassification = {
        status: "sobrio",
        label: "Sobrio / Alcohol no detectable",
        color: "text-emerald-400",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        description: "El organismo ha procesado biológicamente las dosis registradas.",
      };
    }

    // Timeline forecast points
    const timelinePoints = [];
    const maxForecastHours = Math.min(14, Math.ceil(hoursToCompleteElimination) + 2);
    for (let h = 0; h <= maxForecastHours; h++) {
      const estimatedPointBac = Math.max(0, currentBac - h * betaRatePerHour);
      timelinePoints.push({
        hoursAhead: h,
        bac: Number(estimatedPointBac.toFixed(2)),
      });
      if (estimatedPointBac <= 0 && h > 0) break;
    }

    return {
      totalGramsAlcohol,
      theoreticalPeakBac: Number(theoreticalPeakBac.toFixed(2)),
      currentBac: Number(currentBac.toFixed(2)),
      hoursToCompleteElimination: Number(hoursToCompleteElimination.toFixed(1)),
      hoursToUnder03: Number(hoursToUnder03.toFixed(1)),
      legalClassification,
      timelinePoints,
    };
  }, [drinks, gender, weightKg, hoursElapsed, ateFood]);

  return (
    <div className="space-y-6">
      {/* Obligatory Chilean Legal Disclaimer Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 shadow-glow-amber">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs text-amber-200 leading-relaxed">
            <span className="font-extrabold text-amber-300 uppercase tracking-wide block mb-1">
              AVISO LEGAL OBLIGATORIO Y REFERENCIAL
            </span>
            <p>
              {locale.legal.disclaimerText || locale.legal.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Intro Header */}
      <div className="bg-gradient-to-r from-night-900 to-night-850 p-5 rounded-3xl border border-indigo-500/20 shadow-glow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">¿En cuánto se me pasa?</h1>
            <p className="text-xs text-slate-400">
              Simulador biológico referencial de absorción y eliminación de Widmark
            </p>
          </div>
        </div>
      </div>

      {/* Biological Parameters */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>1. Parámetros Biológicos</span>
        </h2>

        {/* Gender & Food */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Sexo Biológico
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  gender === "male"
                    ? "bg-carrete-primary text-white shadow-glow"
                    : "bg-night-900 text-slate-400 hover:text-white"
                }`}
              >
                Hombre
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  gender === "female"
                    ? "bg-carrete-secondary text-white shadow-glow"
                    : "bg-night-900 text-slate-400 hover:text-white"
                }`}
              >
                Mujer
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              ¿Comiste antes o durante?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAteFood(true)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  ateFood
                    ? "bg-emerald-600 text-white shadow-glow-accent"
                    : "bg-night-900 text-slate-400 hover:text-white"
                }`}
              >
                Sí (Comida)
              </button>
              <button
                type="button"
                onClick={() => setAteFood(false)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  !ateFood
                    ? "bg-amber-600 text-white shadow-glow-amber"
                    : "bg-night-900 text-slate-400 hover:text-white"
                }`}
              >
                En ayunas
              </button>
            </div>
          </div>
        </div>

        {/* Weight & Time Elapsed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>Peso corporal</span>
              </span>
              <span className="font-bold text-white bg-night-900 px-2 py-0.5 rounded-lg border border-night-800">
                {weightKg} kg
              </span>
            </div>
            <input
              type="range"
              min={45}
              max={120}
              step={1}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full h-2 bg-night-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horas desde el primer trago</span>
              </span>
              <span className="font-bold text-white bg-night-900 px-2 py-0.5 rounded-lg border border-night-800">
                {hoursElapsed} horas
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={hoursElapsed}
              onChange={(e) => setHoursElapsed(Number(e.target.value))}
              className="w-full h-2 bg-night-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Drink Counters */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>2. Registro de Tragos Consumidos</span>
          <span className="text-xs text-indigo-400 font-semibold">
            {stats.totalGramsAlcohol.toFixed(0)}g alcohol puro
          </span>
        </h2>

        <div className="space-y-2.5">
          {drinks.map((drink) => (
            <div
              key={drink.id}
              className="p-3.5 rounded-2xl bg-night-900 border border-night-800 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-100 text-xs truncate">
                  {drink.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ~{drink.gramsAlcohol.toFixed(1)}g alcohol por vaso
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateDrinkCount(drink.id, -1)}
                  disabled={drink.count === 0}
                  className="w-9 h-9 rounded-xl bg-night-800 hover:bg-night-700 disabled:opacity-30 border border-night-700 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center font-extrabold text-sm text-white">
                  {drink.count}
                </span>
                <button
                  type="button"
                  onClick={() => updateDrinkCount(drink.id, 1)}
                  className="w-9 h-9 rounded-xl bg-carrete-primary/20 hover:bg-carrete-primary/30 border border-carrete-primary/40 text-indigo-300 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Biological & Legal Output */}
      <div className="glass-panel p-5 rounded-3xl space-y-5 border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-800 pb-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Concentración Estimada Actual (BAC)
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
              <span className={stats.legalClassification.color}>
                {stats.currentBac.toFixed(2)} g/l
              </span>
              <span className="text-xs font-normal text-slate-400">
                (pico teórico: {stats.theoreticalPeakBac} g/l)
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-2xl border text-xs font-bold max-w-fit ${stats.legalClassification.badgeColor}`}
          >
            {stats.legalClassification.label}
          </div>
        </div>

        {/* Legal Explanation */}
        <div className="p-3.5 rounded-2xl bg-night-900/90 border border-night-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Car className="w-4 h-4 text-carrete-danger" />
            <span>Marco Legal ({locale.countryName}):</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            {stats.legalClassification.description}
          </p>
        </div>

        {/* Time estimations cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-night-900 border border-night-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              Tiempo estimado a 0.00 g/l
            </span>
            <div className="text-xl font-extrabold text-indigo-300">
              {stats.hoursToCompleteElimination > 0
                ? `~${stats.hoursToCompleteElimination} horas`
                : "0 horas (Eliminado)"}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              A tasa hepática estándar
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-night-900 border border-night-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              Bajo umbral penal (&lt; {locale.legal.bacLimitText})
            </span>
            <div className="text-xl font-extrabold text-amber-300">
              {stats.hoursToUnder03 > 0
                ? `~${stats.hoursToUnder03} horas`
                : `Bajo ${locale.legal.bacLimitText}`}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Aún así, ¡no conduzcas!
            </span>
          </div>
        </div>

        {/* Hourly Timeline Projection */}
        {stats.timelinePoints.length > 1 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Curva de Descenso Metabólico
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {stats.timelinePoints.slice(0, 6).map((point) => (
                <div
                  key={point.hoursAhead}
                  className="p-2.5 rounded-xl bg-night-900 border border-night-800 text-center"
                >
                  <span className="text-[10px] text-slate-400 block">
                    {point.hoursAhead === 0 ? "Ahora" : `+${point.hoursAhead}h`}
                  </span>
                  <span
                    className={`text-xs font-extrabold block mt-0.5 ${
                      point.bac >= 0.8
                        ? "text-red-400"
                        : point.bac >= 0.3
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {point.bac} g/l
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
