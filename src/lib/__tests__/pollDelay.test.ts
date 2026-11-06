import { describe, expect, it } from "vitest";
import { pollDelay } from "@/lib/pollDelay";
import type { LiveRound } from "@/lib/carreteState";

const open = { id: "r", game: "yonunca", prompt: "", options: [], startedAt: 0, votes: {} } as LiveRound;

describe("polling adaptativo", () => {
  it("2 s sin ronda abierta", () => expect(pollDelay(null, 0, false)).toBe(2000));
  it("700 ms con una ronda abierta (los votos se sienten al instante)", () => expect(pollDelay(open, 0, false)).toBe(700));
  it("vuelve a 2 s cuando la ronda ya se reveló", () => expect(pollDelay({ ...open, revealedAt: 1 }, 0, false)).toBe(2000));
  it("con fallos duplica hasta 16 s", () => expect(pollDelay(open, 10, false)).toBe(16000));
  it("con la pestaña oculta espera al menos 8 s", () => expect(pollDelay(open, 0, true)).toBe(8000));
});
