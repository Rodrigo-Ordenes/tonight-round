import React from "react";
import { Metadata } from "next";
import CasinoSection from "@/components/rooms/CasinoSection";

export const metadata: Metadata = {
  title: "Casino · Tonight",
  description: "Blackjack, ruleta y la Frutillita con puntos: solo, en este computador, o en la TV con los celulares de la sala.",
};

export default function CasinoPage() {
  return <CasinoSection />;
}
