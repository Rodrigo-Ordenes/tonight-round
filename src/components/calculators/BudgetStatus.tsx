"use client";

import React from "react";
import { DollarSign, AlertCircle, CheckCircle2, Users } from "lucide-react";

interface BudgetStatusProps {
  budget: number;
  total: number;
  attendees: number;
}

export default function BudgetStatus({ budget, total, attendees }: BudgetStatusProps) {
  const diff = budget - total;
  const safeAttendees = Math.max(1, attendees);
  const perPerson = Math.round(total / safeAttendees);
  const isOver = diff < 0;
  const extraPerPerson = isOver ? Math.ceil(Math.abs(diff) / safeAttendees) : 0;

  return (
    <div
      className={`p-4 rounded-3xl border transition-all ${
        isOver
          ? "bg-rose-950/40 border-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : "bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isOver ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {isOver ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Balance del Carrete
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isOver
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {isOver ? "Presupuesto Excedido" : "En Presupuesto"}
              </span>
            </div>

            <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {isOver ? (
                <span className="text-rose-400">
                  Faltan ${Math.abs(diff).toLocaleString("es-CL")} CLP
                </span>
              ) : (
                <span className="text-emerald-400">
                  Te sobran ${diff.toLocaleString("es-CL")} CLP
                </span>
              )}
            </p>
            {isOver && (
              <p className="text-xs text-rose-300 font-semibold">
                (Requiere ${extraPerPerson.toLocaleString("es-CL")} extra por persona)
              </p>
            )}
          </div>
        </div>

        {/* Cuota por persona reactiva */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-night-900/90 border border-slate-700/80 sm:self-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Cuota sugerida / pers. ({safeAttendees})
            </span>
            <span className="text-base font-black text-white font-mono">
              ${perPerson.toLocaleString("es-CL")} CLP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
