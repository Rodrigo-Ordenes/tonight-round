import React from "react";
import { Metadata } from "next";
import CarreteBasketView from "@/components/calculators/CarreteBasketView";

export const metadata: Metadata = {
  title: "Canasta & Cotizador de Carrete | Tonight 🇨🇱",
  description:
    "Compara precios entre Líder, Jumbo y Botillería. Canasta 100% dinámica con presupuesto, cuotas por persona y exportación a delivery.",
};

export default function ArmarPage() {
  return (
    <div className="py-2">
      <CarreteBasketView />
    </div>
  );
}
