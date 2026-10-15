import React from "react";
import { Metadata } from "next";
import GameDeck from "@/components/games/GameDeck";

export const metadata: Metadata = {
  title: "Juegos · Tonight",
  description:
    "Juegos en vivo con la TV y votos secretos desde el celular, juegos rápidos y clásicos de carrete.",
};

export default function JuegosPage() {
  return (
    <div className="py-2">
      <GameDeck />
    </div>
  );
}
