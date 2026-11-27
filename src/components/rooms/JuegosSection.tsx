"use client";

import React from "react";
import SectionStage, { type StageOption } from "./SectionStage";
import GameDeck from "@/components/games/GameDeck";
import { useActiveCode } from "@/lib/useActiveCode";
import { useRoomActions } from "@/lib/useRoomActions";
import { SOLO } from "@/store/useCarreteStore";

/**
 * Juegos de la sala: los juegos de grupo son para quienes entran a una sala (cada celular vota en secreto y la TV
 * revela). Con sala, directo a jugar; sin sala, el host invita a crearla o a entrar con código, y mientras tanto quedan
 * los juegos rápidos de un solo celular. El casino tiene su propio apartado.
 */
export default function JuegosSection() {
  const { code, hydrated } = useActiveCode();
  const room = hydrated && code && code !== SOLO ? code : null;
  const { busy, create } = useRoomActions();

  if (!room) {
    const options: StageOption[] = [
      { id: "crear", label: "Crear sala", hint: "Para jugar con los celulares y la TV", icon: "✨", onSelect: () => void create(), primary: true, busy: busy === "create" },
      { id: "codigo", label: "Tengo un código", hint: "Me invitaron a una sala", icon: "🔑", href: "/sala?codigo=1" },
      { id: "casino", label: "Ir al casino", hint: "Blackjack, ruleta y la Frutillita, solo con puntos", icon: "🎰", href: "/casino" },
    ];
    return (
      <SectionStage
        id="juegos"
        video="sala"
        eyebrow="Juegos de la sala"
        title="Se juega en sala"
        lines={["Los juegos de grupo se juegan en sala: cada celular vota en secreto y la TV revela.", "Crea la sala o entra con el código que te pasaron, y empezamos.", "Mientras tanto, abajo hay juegos rápidos para un solo celular."]}
        options={options}
      >
        <GameDeck live={false} />
      </SectionStage>
    );
  }

  return (
    <SectionStage
      id="juegos"
      video="sala"
      eyebrow={`Sala ${room} · en vivo`}
      title="Juegos de la sala"
      lines={["La sala está lista: cada celular vota en secreto y la TV revela.", "Perder da un reto con alternativas: nunca obliga a tomar.", "¿Sin TV? Hay juegos rápidos con un solo celular."]}
      compact
    >
      <GameDeck />
    </SectionStage>
  );
}
