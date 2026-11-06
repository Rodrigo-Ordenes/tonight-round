import { describe, expect, it } from "vitest";
import { tally } from "@/lib/liveGames";
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
