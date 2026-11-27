"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SectionStage, { type StageOption } from "./SectionStage";
import SlidingIndicator, { useActiveRect } from "@/components/ui/SlidingIndicator";
import CarreteBasketView from "@/components/calculators/CarreteBasketView";
import SplitBill from "@/components/calculators/SplitBill";
import SplitStudio from "@/components/calculators/SplitStudio";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";

/**
 * La compra y la cuenta (desde el apartado Sala): primero la lista con precios reales; al final de la noche, la cuenta
 * y la rendición entre todos (quien maneja no paga el alcohol, transferencias mínimas). Se llega directo a cada parte
 * con `?ver=compra` o `?ver=cuenta`.
 */
export default function ArmarSection() {
  const params = useSearchParams();
  const router = useRouter();
  const ver = params.get("ver") === "cuenta" ? "cuenta" : "compra";
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const [split, setSplit] = useState<"grupo" | "boleta">("grupo");
  const splitTabs = useRef<HTMLDivElement>(null);
  const splitRect = useActiveRect(splitTabs, '[aria-selected="true"]', split);

  const go = (v: "compra" | "cuenta") => router.replace(`/armar?ver=${v}`, { scroll: false });
  const options: StageOption[] = [
    { id: "compra", label: "La compra", hint: "Cuántos son, cuánto ponen y la lista por tienda", icon: "🛒", onSelect: () => go("compra") },
    { id: "cuenta", label: "La cuenta", hint: "Quién puso qué y quién le transfiere a quién", icon: "🧾", onSelect: () => go("cuenta") },
  ];
  const lines =
    ver === "compra"
      ? ["Dime cuántos son y cuánto ponen: te armo la canasta con precios reales.", "El alcohol primero, después el hielo y el agua. Siempre con opción sin alcohol."]
      : ["Cuentas claras: cada uno suma lo que puso.", "Quien maneja no paga el alcohol. Al final te digo quién le transfiere a quién."];

  return (
    <SectionStage id="armar" video="cuentas" eyebrow="Sala · la previa" title={ver === "compra" ? "La compra" : "La cuenta"} lines={lines} options={options} active={ver} compact>
      <div className="relative pt-6 pb-12">
        {ver === "compra" ? (
          <CarreteBasketView bare />
        ) : (
          <div className="space-y-6">
            <div ref={splitTabs} className="relative inline-flex rounded-2xl bg-white/[0.04] p-1" role="tablist" aria-label="Tipo de división">
              <SlidingIndicator rect={splitRect} className="rounded-xl bg-white" />
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
                  aria-selected={split === t.id}
                  onClick={() => setSplit(t.id)}
                  className={`relative min-h-[44px] rounded-xl px-4 text-sm font-bold transition-colors duration-300 ${split === t.id ? "text-night-950" : "text-slate-300"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {split === "grupo" ? <SplitStudio store={store} /> : <SplitBill />}
          </div>
        )}
      </div>
    </SectionStage>
  );
}
