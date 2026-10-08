"use client";

import React from "react";
import type { CarreteStore } from "@/store/useCarreteStore";
import SafeArrivalTracker from "@/components/safety/SafeArrivalTracker";
import ReturnPoolManager from "@/components/safety/ReturnPoolManager";

interface CarreteReturnSafeProps {
  store: CarreteStore;
}

export default function CarreteReturnSafe({ store }: CarreteReturnSafeProps) {
  return (
    <div className="space-y-6">
      {/* 1. Tablero 'Llegué a Salvo' */}
      <SafeArrivalTracker store={store} />

      {/* 2. Pool de Retorno por Comunas & Uber */}
      <ReturnPoolManager store={store} />
    </div>
  );
}
