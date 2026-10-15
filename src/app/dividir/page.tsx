"use client";

import React, { useState } from "react";
import SplitBill from "@/components/calculators/SplitBill";
import SplitStudio from "@/components/calculators/SplitStudio";
import PageHeader from "@/components/ui/PageHeader";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";

export default function DividirPage() {
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const [tab, setTab] = useState<"grupo" | "boleta">("grupo");

  return (
    <div className="pb-12">
      <PageHeader
        eyebrow="Cuentas"
        title="Cuentas claras"
        aside={
          <div className="flex rounded-2xl bg-white/[0.04] p-1" role="tablist" aria-label="Tipo de división">
            {(
              [
                { id: "grupo", label: "Varios pagaron" },
                { id: "boleta", label: "Una boleta" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-bold ${tab === t.id ? "bg-white text-night-950" : "text-slate-300"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        Quien maneja no paga el alcohol, cada uno suma lo que puso y Tonight calcula las transferencias mínimas.
      </PageHeader>
      {tab === "grupo" ? <SplitStudio store={store} /> : <SplitBill />}
    </div>
  );
}
