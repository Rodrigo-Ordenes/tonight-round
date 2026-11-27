"use client";

import React from "react";
import MesaShell from "./MesaShell";
import ClassicSolo from "./ClassicSolo";
import FrutillitaSolo from "@/components/party/FrutillitaSolo";
import type { LiveGame } from "@/lib/carreteState";

const NOMBRE: Partial<Record<LiveGame, string>> = { frutillita: "La Frutillita", tragamonedas: "Tragamonedas", tragabar: "Tragabar", jackpot: "El jackpot" };
const DICE: Partial<Record<LiveGame, string[]>> = {
  frutillita: ["La máquina de la casa: tres frutillas abren La vuelta.", "Elige líneas y apuesta con los botones, y tira la palanca.", "Si La vuelta se alarga, «Cobrar ya» y sigues jugando."],
  tragamonedas: ["Tres sietes pagan el pozo. Tira la palanca.", "Solo puntos: la casa presta si se acaban."],
  tragabar: ["La máquina del bar: los tragos de la casa en los rodillos.", "Tira la palanca y que pague la barra."],
  jackpot: ["Tres máquinas y un pozo: elige la tuya.", "El jackpot se lleva el pozo completo."],
};

/**
 * Las máquinas del salón (la Frutillita y las clásicas): el gabinete con su marquesina de ampolletas que corren, en la
 * misma sala del casino, con el host a un costado. Juego continuo, solo puntos.
 */
export default function MaquinaMesa({ game, credits, addCredits }: { game: LiveGame; credits: number; addCredits: (delta: number) => void }) {
  return (
    <MesaShell id={game} title={NOMBRE[game] ?? "La máquina"} credits={credits} lines={DICE[game] ?? ["Tira la palanca."]} host="abajo">
      <div className="slot-marquee mx-auto mt-3 w-full max-w-3xl">
        <div className="relative space-y-4 rounded-[22px] p-3 sm:p-5">{game === "frutillita" ? <FrutillitaSolo credits={credits} addCredits={addCredits} /> : <ClassicSolo game={game} addCredits={addCredits} big />}</div>
      </div>
    </MesaShell>
  );
}
