"use client";

import { ChevronUp, Droplets, Plus } from "lucide-react";

/** Las dos acciones de toda la noche, siempre a mano sobre el dock. */
export default function QuickActionBar({
  drinkLabel,
  showDrink,
  onDrink,
  onPick,
  onWater,
}: {
  drinkLabel: string | null;
  /** El conductor designado no ve el atajo de trago. */
  showDrink: boolean;
  onDrink: () => void;
  onPick: () => void;
  onWater: () => void;
}) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-md gap-2 rounded-2xl border border-white/10 bg-night-800 p-2 lg:bottom-4">
      {showDrink && (
        <div className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={drinkLabel ? onDrink : onPick}
            className="btn-primary min-w-0 flex-1 !rounded-r-none !px-3"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{drinkLabel ?? "Elegir trago"}</span>
          </button>
          <button
            type="button"
            onClick={onPick}
            aria-label="Elegir otro trago"
            className="btn-primary !min-w-[44px] !rounded-l-none border-l border-night-950/30 !px-2"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
      <button type="button" onClick={onWater} className={`btn shrink-0 border border-cyan-300/40 bg-cyan-400/15 text-cyan-50 ${showDrink ? "" : "flex-1"}`}>
        <Droplets className="h-4 w-4" aria-hidden /> +1 agua
      </button>
    </div>
  );
}
