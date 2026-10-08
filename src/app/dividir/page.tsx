import React from "react";
import { Metadata } from "next";
import SplitBill from "@/components/calculators/SplitBill";

export const metadata: Metadata = {
  title: "Dividir Cuenta | Tonight 🇨🇱",
  description:
    "Calculadora de división de gastos del carrete con cobro y datos de transferencia listos para enviar por WhatsApp.",
};

export default function DividirPage() {
  return (
    <div className="py-2">
      <SplitBill />
    </div>
  );
}
