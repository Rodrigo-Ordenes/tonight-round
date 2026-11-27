import React, { Suspense } from "react";
import { Metadata } from "next";
import ArmarSection from "@/components/rooms/ArmarSection";

export const metadata: Metadata = {
  title: "La compra y la cuenta · Tonight",
  description:
    "Lista de compras multi-licor con presupuesto por persona y precios por tienda; después, la cuenta y la rendición entre todos.",
};

export default function ArmarPage() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" />}>
      <ArmarSection />
    </Suspense>
  );
}
