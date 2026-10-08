import React from "react";
import { Metadata } from "next";
import GameDeck from "@/components/games/GameDeck";

export const metadata: Metadata = {
  title: "Juegos pa' Tomar & Modo Smart TV | Tonight 🇨🇱",
  description:
    "Catálogo de dinámicas sociales, ruleta aleatoria interactiva y Modo Smart TV a pantalla completa con código QR para proyectores.",
};

export default function JuegosPage() {
  return (
    <div className="py-2">
      <GameDeck />
    </div>
  );
}
