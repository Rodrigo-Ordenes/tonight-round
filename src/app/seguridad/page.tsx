import React from "react";
import { Metadata } from "next";
import SafeReturnHub from "@/components/safety/SafeReturnHub";

export const metadata: Metadata = {
  title: "Retorno Seguro & Check-in 🏠 | Tonight 🇨🇱",
  description:
    "Pedir viaje de regreso en Uber/Cabify/DiDi y confirmar llegada a salvo para tranquilidad de los amigos.",
};

export default function SeguridadPage() {
  return (
    <div className="py-2">
      <SafeReturnHub />
    </div>
  );
}
