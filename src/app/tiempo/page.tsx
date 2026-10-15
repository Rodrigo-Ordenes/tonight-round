import React from "react";
import { Metadata } from "next";
import EliminationTimeline from "@/components/calculators/EliminationTimeline";

export const metadata: Metadata = {
  title: "¿En cuánto se me pasa? · Tonight",
  description:
    "Simulador biológico de metabolización de alcohol (Modelo de Widmark) y guía del marco legal chileno (Ley Emilia y Tolerancia Cero).",
};

export default function TiempoPage() {
  return (
    <div className="py-2">
      <EliminationTimeline />
    </div>
  );
}
