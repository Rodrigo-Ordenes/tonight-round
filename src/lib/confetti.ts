"use client";

import type { Options } from "canvas-confetti";

export async function fireConfetti(options?: Options) {
  if (typeof window === "undefined") return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    return confetti(options);
  } catch (err) {
    console.warn("Could not fire confetti:", err);
  }
}
