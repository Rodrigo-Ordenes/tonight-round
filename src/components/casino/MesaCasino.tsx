"use client";

import React from "react";
import BlackjackMesa from "./BlackjackMesa";
import RuletaMesa from "./RuletaMesa";
import MaquinaMesa from "./MaquinaMesa";
import { useCasinoCredits } from "./useCasinoCredits";
import type { LiveGame } from "@/lib/carreteState";

/** La mesa elegida del casino, con los créditos de este navegador (solo puntos) */
export default function MesaCasino({ mesa }: { mesa: LiveGame }) {
  const { credits, addCredits } = useCasinoCredits();
  if (mesa === "blackjack") return <BlackjackMesa credits={credits} addCredits={addCredits} />;
  if (mesa === "ruleta") return <RuletaMesa credits={credits} addCredits={addCredits} />;
  return <MaquinaMesa game={mesa} credits={credits} addCredits={addCredits} />;
}
