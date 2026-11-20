import { describe, expect, it } from "vitest";
import { SLOT_BAR, SLOT_CLASSIC, blackjackDeal, blackjackOutcome, handValue, jackpotMachines, rouletteColor, rouletteNumber, rouletteWins, slotPayout, slotSpin } from "@/lib/casinoGames";
import { resolveParty, type Card } from "@/lib/partyGames";
import type { LiveRound, Participant } from "@/lib/carreteState";

const sym = (list: typeof SLOT_CLASSIC, id: string) => list.find((s) => s.id === id)!;
const card = (rank: number, suit: Card["suit"] = "♠"): Card => ({ rank, suit });
const people = ["a", "b", "c"].map((id, i) => ({ id, name: ["Nacho", "Coté", "Pancho"][i] }) as Participant);
const round = (game: LiveRound["game"], votes: Record<string, string>, seed = 1234): LiveRound =>
  ({ id: "r", game, startedAt: 0, durationMs: 1, seed, prompt: "", options: [], votes: Object.fromEntries(Object.entries(votes).map(([k, v]) => [k, { value: v, at: 0 }])), revealedAt: 1 }) as unknown as LiveRound;

describe("casino de puntos", () => {
  it("cada tirada sale igual en todos los dispositivos y distinta entre jugadores", () => {
    expect(slotSpin(99, "a", "clasica")).toEqual(slotSpin(99, "a", "clasica"));
    const many = new Set(Array.from({ length: 30 }, (_, i) => slotSpin(99, `p${i}`, "clasica").map((s) => s.id).join()));
    expect(many.size).toBeGreaterThan(10);
  });

  it("tres logos de Tonight pagan el premio mayor; un par paga poco", () => {
    expect(slotPayout([0, 0, 0].map(() => sym(SLOT_CLASSIC, "logo")), "clasica").points).toBe(50);
    expect(slotPayout([sym(SLOT_CLASSIC, "siete"), sym(SLOT_CLASSIC, "siete"), sym(SLOT_CLASSIC, "uva")], "clasica").points).toBe(8);
    expect(slotPayout([sym(SLOT_CLASSIC, "siete"), sym(SLOT_CLASSIC, "uva"), sym(SLOT_CLASSIC, "campana")], "clasica").points).toBe(0);
  });

  it("en la del bar, el vaso de agua es comodín y tres aguas también pagan", () => {
    expect(slotPayout([sym(SLOT_BAR, "mojito"), sym(SLOT_BAR, "agua"), sym(SLOT_BAR, "mojito")], "bar").points).toBe(20);
    expect(slotPayout([sym(SLOT_BAR, "agua"), sym(SLOT_BAR, "agua"), sym(SLOT_BAR, "agua")], "bar").points).toBe(40);
  });

  it("el jackpot de la sala: una máquina paga el pozo, otra poco y otra nada", () => {
    expect(jackpotMachines(7).map((m) => m.points).sort((x, y) => x - y)).toEqual([0, 10, 25]);
  });

  it("ruleta europea: el cero es menta y solo paga a quien apostó al cero", () => {
    expect(rouletteColor(0)).toBe("menta");
    expect(rouletteColor(1)).toBe("morado");
    expect(rouletteColor(2)).toBe("azul");
    expect(rouletteWins("par", 0)).toBe(false);
    expect(rouletteWins("cero", 0)).toBe(true);
    expect(rouletteWins("d3", 36)).toBe(true);
    const n = rouletteNumber(5);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(36);
  });

  it("blackjack: el as vale 11 o 1, el host se planta en 17 y todos ven el mismo reparto", () => {
    expect(handValue([card(14), card(13)])).toBe(21);
    expect(handValue([card(14), card(14), card(9)])).toBe(21);
    expect(handValue([card(10), card(9), card(5)])).toBe(24);
    const plans = [
      { id: "b", stand: 17 },
      { id: "a", stand: 15 },
    ];
    const one = blackjackDeal(77, plans);
    expect(blackjackDeal(77, [...plans].reverse())).toEqual(one);
    expect(handValue(one.dealer)).toBeGreaterThanOrEqual(17);
    expect(blackjackOutcome([card(14), card(13)], [card(10), card(7)]).points).toBe(30);
    expect(blackjackOutcome([card(10), card(9), card(5)], [card(10), card(7)]).lose).toBe(true);
  });

  it("la ronda se resuelve con puntos para cada participante que jugó", () => {
    for (const game of ["tragamonedas", "tragabar", "jackpot", "ruleta", "blackjack"] as const) {
      const votes = game === "ruleta" ? { a: "par", b: "morado", c: "cero" } : game === "blackjack" ? { a: "15", b: "17", c: "19" } : game === "jackpot" ? { a: "1", b: "2", c: "3" } : { a: "tirar", b: "tirar", c: "tirar" };
      const res = resolveParty(round(game, votes), people);
      expect(res.rows).toHaveLength(3);
      expect(res.headline.length).toBeGreaterThan(5);
      res.rows.forEach((r) => expect(r.points).toBeGreaterThanOrEqual(0));
      // Reducción de daños: en el casino perder no genera retos ni sorbos
      expect(res.loserIds).toHaveLength(0);
    }
  });
});
