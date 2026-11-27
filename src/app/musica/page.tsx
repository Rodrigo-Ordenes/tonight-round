import React from "react";
import { Metadata } from "next";
import MusicaSection from "@/components/rooms/MusicaSection";

export const metadata: Metadata = {
  title: "La pista · Tonight",
  description: "La música de la noche: tu lista de Spotify o YouTube sonando mientras recorres el club, y en sala una fila de canciones con votos.",
};

export default function MusicaPage() {
  return <MusicaSection />;
}
