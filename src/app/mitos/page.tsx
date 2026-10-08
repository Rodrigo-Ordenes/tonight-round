"use client";

import React, { useState, useMemo } from "react";
import { 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import mythsData from "@/data/myths.json";
import { useLocale } from "@/lib/useLocale";

interface MythItem {
  id: string;
  title: string;
  verdict: string;
  verdict_type: "true" | "false" | "nuance";
  short_explanation: string;
  scientific_details: string;
  scientific_source: string;
  recommendation: string;
}

export default function MitosPage() {
  const { locale } = useLocale();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMyths = useMemo(() => {
    return (mythsData as MythItem[]).filter((m) => {
      const matchesFilter =
        filterType === "all" || m.verdict_type === filterType;
      const matchesQuery =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.short_explanation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filterType, searchQuery]);

  const getVerdictBadge = (type: MythItem["verdict_type"], label: string) => {
    switch (type) {
      case "true":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            {label}
          </span>
        );
      case "false":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            {label}
          </span>
        );
      case "nuance":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            {label}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-night-900 to-night-850 p-5 rounded-3xl border border-slate-700/60 shadow-glow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-slate-800 text-slate-300">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Mitos y Verdades</h1>
            <p className="text-xs text-slate-400">
              Desmitificando {locale.slang?.party ? `el ${locale.slang.party}` : "la fiesta"} y {locale.slang?.hangover ? `la ${locale.slang.hangover}` : "la resaca"} con evidencia médica y científica ({locale.countryName})
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-3xl space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por mito (ej: café, mezclar, agua)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-night-900 border border-night-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "Todos" },
            { id: "false", label: "Falsos ❌" },
            { id: "true", label: "Verdaderos ✔️" },
            { id: "nuance", label: "Matices ⚠️" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                filterType === f.id
                  ? "bg-indigo-600 text-white shadow-glow"
                  : "bg-night-850 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Myths Cards Feed */}
      <div className="space-y-3.5">
        {filteredMyths.map((myth) => {
          const isExpanded = expandedId === myth.id;

          return (
            <div
              key={myth.id}
              className="glass-panel p-5 rounded-3xl border border-night-800 hover:border-night-700 transition-all bg-night-950/70"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h3 className="font-extrabold text-sm text-white tracking-tight leading-snug">
                  {myth.title}
                </h3>
                <div className="shrink-0">
                  {getVerdictBadge(myth.verdict_type, myth.verdict)}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {myth.short_explanation}
              </p>

              {/* Toggle scientific details */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : myth.id)}
                className="mt-3 w-full py-2 px-3 rounded-2xl bg-night-900 hover:bg-night-850 border border-night-800 text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>{isExpanded ? "Ocultar Explicación Científica" : "Ver Explicación Científica y Fuente"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Accordion content */}
              {isExpanded && (
                <div className="mt-3.5 pt-3 border-t border-night-800 space-y-3 text-xs animate-fade-in">
                  <div>
                    <h4 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Fisiología y Mecanismo Biológico</span>
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      {myth.scientific_details}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200">
                    <span className="font-bold block text-[11px] text-indigo-300 mb-0.5">
                      💡 Consejo Práctico:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {myth.recommendation}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold">Fuente:</span>
                    <span>{myth.scientific_source}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
