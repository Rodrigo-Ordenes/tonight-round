import React, { Suspense } from "react";
import BarSection from "@/components/rooms/BarSection";

export default function BarPage() {
  return (
    <Suspense fallback={<div className="min-h-[60dvh]" />}>
      <BarSection />
    </Suspense>
  );
}
