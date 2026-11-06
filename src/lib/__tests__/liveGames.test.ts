import { describe, expect, it } from "vitest";
import { tally, isRoundDriver, roundRemaining } from "@/lib/liveGames";
import type { LiveRound } from "@/lib/carreteState";
import { person } from "./fixtures";

const people = ["a", "b", "c"].map((id) => person(id));
const round = (over: Partial<LiveRound>): LiveRound => ({
  id: "r1",
  game: "yonunca",
  prompt: "Yo nunca…",
  options: [
    { id: "si", label: "Sí" },
    { id: "no", label: "No" },
  ],
  startedAt: 1,
  votes: {},
  ...over,
});

describe("conteo de rondas", () => {
  it("en Yo nunca pierden quienes votaron sí", () => {
    const t = tally(round({ votes: { a: { value: "si", at: 1 }, b: { value: "no", at: 1 }, c: { value: "si", at: 1 } } }), people);
    expect(t.loserIds.sort()).toEqual(["a", "c"]);
  });

  it("si atrapan al impostor, solo él cumple", () => {
    const r = round({
      game: "impostor",
      answer: "c",
      secret: "Sushi",
      options: people.map((p) => ({ id: p.id, label: p.name })),
      votes: { a: { value: "c", at: 1 }, b: { value: "c", at: 1 }, c: { value: "a", at: 1 } },
    });
    expect(tally(r, people).loserIds).toEqual(["c"]);
  });
});

import { shouldAutoReveal, buildRound } from "@/lib/liveGames";

describe("auto-revelar", () => {
  const base = round({ startedAt: 1_000, durationMs: 30_000 });
  it("no revela con una sola persona aunque haya votado", () => {
    expect(shouldAutoReveal({ ...base, votes: { a: { value: "si", at: 1 } } }, 1, 2_000)).toBe(false);
  });
  it("revela cuando votaron todos (2 o más)", () => {
    expect(shouldAutoReveal({ ...base, votes: { a: { value: "si", at: 1 }, b: { value: "no", at: 1 } } }, 2, 2_000)).toBe(true);
  });
  it("revela al acabarse el tiempo si hay al menos un voto", () => {
    expect(shouldAutoReveal({ ...base, votes: { a: { value: "si", at: 1 } } }, 3, 31_001)).toBe(true);
  });
  it("no revela al acabarse el tiempo sin votos", () => {
    expect(shouldAutoReveal(base, 3, 40_000)).toBe(false);
  });
  it("no vuelve a revelar una ronda ya revelada", () => {
    expect(shouldAutoReveal({ ...base, revealedAt: 5, votes: { a: { value: "si", at: 1 }, b: { value: "si", at: 1 } } }, 2, 2_000)).toBe(false);
  });
  it("las rondas nuevas traen 30 s (45 s en El Impostor)", () => {
    const ctx = { participants: people, confessions: [], usedPrompts: new Set<string>() };
    const r1 = buildRound("yonunca", ctx);
    const r2 = buildRound("impostor", ctx);
    expect("durationMs" in r1 && r1.durationMs).toBe(30_000);
    expect("durationMs" in r2 && r2.durationMs).toBe(45_000);
  });
});

describe("quién maneja el reloj de la ronda", () => {
  const r = { hostId: "ana" } as Parameters<typeof isRoundDriver>[0];
  it("la TV siempre; entre celulares, solo quien inició la ronda", () => {
    expect(isRoundDriver(r, { tv: true, meId: null })).toBe(true);
    expect(isRoundDriver(r, { tv: false, meId: "ana" })).toBe(true);
    expect(isRoundDriver(r, { tv: false, meId: "beto" })).toBe(false);
    expect(isRoundDriver(r, { tv: false, meId: null })).toBe(false);
  });
  it("una ronda sin anfitrión (anterior a V11) solo la maneja la TV", () => {
    const old = {} as Parameters<typeof isRoundDriver>[0];
    expect(isRoundDriver(old, { tv: false, meId: "ana" })).toBe(false);
    expect(isRoundDriver(old, { tv: true, meId: null })).toBe(true);
  });
});

describe("tiempo restante de la ronda", () => {
  const r = { startedAt: 10_000, durationMs: 30_000 } as Parameters<typeof roundRemaining>[0];
  it("con un reloj anterior al inicio no muestra más que la duración", () => expect(roundRemaining(r, 0)).toBe(30_000));
  it("cuenta hacia cero y no baja de cero", () => {
    expect(roundRemaining(r, 25_000)).toBe(15_000);
    expect(roundRemaining(r, 99_000)).toBe(0);
  });
  it("sin duración devuelve null", () => expect(roundRemaining({ startedAt: 0 } as never, 5)).toBeNull());
});
