import { describe, expect, it } from "vitest";
import { pollDelay } from "@/lib/pollDelay";
import type { LiveRound } from "@/lib/carreteState";

const open = { id: "r", game: "yonunca", prompt: "", options: [], startedAt: 0, votes: {} } as LiveRound;

describe("polling adaptativo", () => {
  it("2 s sin ronda abierta", () => expect(pollDelay(null, 0, false)).toBe(2000));
  it("700 ms con una ronda abierta (los votos se sienten al instante)", () => expect(pollDelay(open, 0, false, 0)).toBe(700));
  it("vuelve a 2 s cuando la ronda ya se reveló", () => expect(pollDelay({ ...open, revealedAt: 1 }, 0, false)).toBe(2000));
  it("con fallos duplica hasta 16 s", () => expect(pollDelay(open, 10, false)).toBe(16000));
  it("con la pestaña oculta espera al menos 8 s", () => expect(pollDelay(open, 0, true)).toBe(8000));
});

describe("polling rápido solo mientras la ronda está en juego", () => {
  const timed = { ...open, startedAt: 0, durationMs: 30_000 } as LiveRound;
  it("rápido dentro del tiempo", () => expect(pollDelay(timed, 0, false, 10_000)).toBe(700));
  it("vuelve a 2 s cuando pasó el tiempo y un margen (ronda abandonada)", () => expect(pollDelay(timed, 0, false, 60_000)).toBe(2000));
  it("ronda sin duración (anterior a V11): rápido solo el primer minuto", () => {
    expect(pollDelay(open, 0, false, 30_000)).toBe(700);
    expect(pollDelay(open, 0, false, 120_000)).toBe(2000);
  });
});
