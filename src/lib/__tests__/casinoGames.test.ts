import { describe, expect, it } from "vitest";
import { SLOT_BAR, SLOT_CLASSIC, bjDealerHand, bjPlayerHand, blackjackOutcome, handValue, jackpotMachines, rouletteColor, rouletteNumber, rouletteWins, slotPayout, slotSpin } from "@/lib/casinoGames";
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

  it("ruleta europea: el cero es verde y solo paga a quien apostó al cero", () => {
    expect(rouletteColor(0)).toBe("verde");
    expect(rouletteColor(1)).toBe("morado");
    expect(rouletteColor(2)).toBe("negro");
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
    expect(bjPlayerHand(77, "a", "p")).toEqual(bjPlayerHand(77, "a", "p"));
    expect(handValue(bjDealerHand(77))).toBeGreaterThanOrEqual(17);
    expect(blackjackOutcome([card(14), card(13)], [card(10), card(7)]).points).toBe(30);
    expect(blackjackOutcome([card(10), card(9), card(5)], [card(10), card(7)]).lose).toBe(true);
  });

  it("la ronda se resuelve con puntos para cada participante que jugó", () => {
    for (const game of ["tragamonedas", "tragabar", "jackpot", "ruleta", "blackjack"] as const) {
      const votes = game === "ruleta" ? { a: "par", b: "morado", c: "cero" } : game === "blackjack" ? { a: "m", b: "pm", c: "d" } : game === "jackpot" ? { a: "1", b: "2", c: "3" } : { a: "tirar", b: "tirar", c: "tirar" };
      const res = resolveParty(round(game, votes), people);
      expect(res.rows).toHaveLength(3);
      expect(res.headline.length).toBeGreaterThan(5);
      res.rows.forEach((r) => expect(r.points).toBeGreaterThanOrEqual(0));
      // Reducción de daños: en el casino perder no genera retos ni sorbos
      expect(res.loserIds).toHaveLength(0);
    }
  });
  it("blackjack mano a mano: pedir suma cartas, plantarse cierra y doblar da una sola carta", () => {
    for (let k = 1; k < 300; k++) {
      const start = bjPlayerHand(k, "a", "");
      if (start.status !== "jugando") continue;
      expect(start.cards).toHaveLength(2);
      const pide = bjPlayerHand(k, "a", "p");
      expect(pide.cards).toHaveLength(3);
      expect(pide.cards.slice(0, 2)).toEqual(start.cards);
      expect(bjPlayerHand(k, "a", "m").status).toBe("plantado");
      const dobla = bjPlayerHand(k, "a", "dp");
      expect(dobla.cards).toHaveLength(3);
      expect(dobla.doubled).toBe(true);
      expect(["doblado", "pasado"]).toContain(dobla.status);
      // Después de pasarse no se sigue pidiendo
      const muchas = bjPlayerHand(k, "a", "pppppppp");
      if (muchas.status === "pasado") expect(handValue(muchas.cards.slice(0, -1))).toBeLessThanOrEqual(21);
    }
    expect(blackjackOutcome([card(10), card(9), card(2)], [card(10), card(8)], true).points).toBe(40);
  });
});
