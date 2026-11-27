import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import MesaCasino from "@/components/casino/MesaCasino";
import type { LiveGame } from "@/lib/carreteState";

const MESAS: Record<string, { game: LiveGame; title: string }> = {
  blackjack: { game: "blackjack", title: "Blackjack" },
  ruleta: { game: "ruleta", title: "La ruleta" },
  frutillita: { game: "frutillita", title: "La Frutillita" },
  tragamonedas: { game: "tragamonedas", title: "Tragamonedas" },
  tragabar: { game: "tragabar", title: "Tragabar" },
  jackpot: { game: "jackpot", title: "El jackpot" },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(MESAS).map((mesa) => ({ mesa }));
}

export async function generateMetadata({ params }: { params: Promise<{ mesa: string }> }): Promise<Metadata> {
  const { mesa } = await params;
  const m = MESAS[mesa];
  return { title: m ? `${m.title} · Casino · Tonight` : "Casino · Tonight" };
}

/** Una mesa del casino a pantalla completa: se llega directo (por ejemplo, /casino/blackjack) */
export default async function MesaPage({ params }: { params: Promise<{ mesa: string }> }) {
  const { mesa } = await params;
  const m = MESAS[mesa];
  if (!m) notFound();
  return <MesaCasino mesa={m.game} />;
}
