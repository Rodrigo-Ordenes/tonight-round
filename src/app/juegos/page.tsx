import React from "react";
import { Metadata } from "next";
import JuegosSection from "@/components/rooms/JuegosSection";

export const metadata: Metadata = {
  title: "Juegos de la sala · Tonight",
  description: "Juegos de grupo en vivo con la TV y votos secretos desde el celular, juegos rápidos y clásicos de carrete.",
};

export default function JuegosPage() {
  return <JuegosSection />;
}
