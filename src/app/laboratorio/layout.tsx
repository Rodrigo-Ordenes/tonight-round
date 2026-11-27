import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorldLab from "@/components/world/lab/WorldLab";

// El laboratorio del motor V14 solo existe con TONIGHT_LABORATORIO=1 en el servidor (pruebas y medición); sin la
// variable, como en producción, es un 404. Se decide en cada pedido, no en el build.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laboratorio del motor · Tonight", robots: { index: false, follow: false } };

export default function LaboratorioLayout({ children }: { children: React.ReactNode }) {
  if (process.env.TONIGHT_LABORATORIO !== "1") notFound();
  return <WorldLab>{children}</WorldLab>;
}
