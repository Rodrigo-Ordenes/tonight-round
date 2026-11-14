"use client";

import { useState } from "react";
import type { Participant } from "@/lib/carreteState";
import { penaltyOptions } from "@/lib/liveGames";

/** El castigo propio con alternativas: se elige en este celular y nadie está obligado. */
export default function PenaltyChooser({ participant, roundId, defaultText }: { participant: Participant; roundId: string; defaultText: string }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const options = penaltyOptions(participant, roundId);
  const passed = chosen === options[options.length - 1].text;

  return (
    <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/15 p-3">
      <p className="text-center font-display text-lg font-bold text-white">{passed ? "Pasas esta vez" : `Te toca: ${chosen ?? defaultText}`}</p>
      <p className="mt-2 text-center text-xs text-slate-300">¿Prefieres otra cosa?</p>
      <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Elige tu alternativa">
        {options.map((o) => (
          <button
            key={o.kind}
            type="button"
            role="radio"
            aria-checked={chosen === o.text}
            onClick={() => setChosen(o.text)}
            className={`chip w-full justify-center whitespace-normal py-2 text-center ${chosen === o.text ? "chip-on" : ""}`}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}
