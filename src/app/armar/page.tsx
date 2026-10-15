import React from "react";
import { Metadata } from "next";
import CarreteBasketView from "@/components/calculators/CarreteBasketView";

export const metadata: Metadata = {
  title: "Armar la previa · Tonight",
  description:
    "Lista de compras multi-licor con presupuesto por persona, precios por tienda y la vaca lista para WhatsApp.",
};

export default function ArmarPage() {
  return (
    <div className="py-2">
      <CarreteBasketView />
    </div>
  );
}
