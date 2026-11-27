import React from "react";
import { notFound } from "next/navigation";
import LabSection from "@/components/world/lab/LabSection";

/** Una pieza del laboratorio en su propia ruta (/laboratorio/mesa): el lienzo del layout sigue vivo al llegar */
export default async function LaboratorioPiezaPage({ params }: { params: Promise<{ pieza: string }> }) {
  const { pieza } = await params;
  if (pieza !== "mesa") notFound();
  return <LabSection />;
}
