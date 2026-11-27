"use client";

import React from "react";
import SectionStage, { type StageOption } from "./SectionStage";
import LiveGameHost from "@/components/live/LiveGameHost";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";

/**
 * Apartado Casino: una sala de juego dentro del gran bar, con su propia luz. Paño esmeralda, oro y marfil (no el
 * neón de la casa), el host encendido en oro que te recibe en la entrada, y las mesas al alcance: blackjack, ruleta y
 * la Frutillita se abren al tiro para jugar aquí; abajo, todas las mesas (y, con sala, en la TV con los celulares).
 * Solo puntos: nadie apuesta plata.
 */
export default function CasinoSection() {
  const { code } = useActiveCode();
  const store = useCarreteStore(code);

  const options: StageOption[] = [
    { id: "blackjack", label: "Blackjack", hint: "Mano a mano contra el host", icon: "🂡", href: "/casino/blackjack" },
    { id: "ruleta", label: "La ruleta", hint: "Fichas en el paño y a girar", icon: "🎡", href: "/casino/ruleta" },
    { id: "frutillita", label: "La Frutillita", hint: "La máquina de la casa, con su vuelta", icon: "🍓", href: "/casino/frutillita" },
    { id: "mesas", label: "Todas las mesas", hint: "Tragamonedas, tragabar y jackpot", icon: "🎰", onSelect: () => document.getElementById("mesas")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
  ];
  const lines = store.isSolo
    ? ["Pasa a la mesa: aquí se juega solo por puntos, nadie apuesta plata.", "Blackjack, ruleta o la Frutillita: tú eliges la mesa.", "Con sala, la TV es el paño y cada celular juega su mano."]
    : [`Sala ${code}: la TV es el paño y cada celular juega su mano.`, "Solo puntos: perder nunca obliga a tomar.", "Blackjack, ruleta o la Frutillita: tú eliges la mesa."];

  return (
    <SectionStage id="casino" video="juegos" theme="casino" sound="chip" eyebrow="Casino Night · solo puntos" title="El casino" lines={lines} options={options}>
      <div id="mesas" className="casino-felt relative -mx-4 scroll-mt-20 rounded-t-[2rem] px-4 pb-14 pt-10 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <LiveGameHost store={store} only="casino" />
      </div>
    </SectionStage>
  );
}
