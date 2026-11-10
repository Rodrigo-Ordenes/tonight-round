import { describe, expect, it } from "vitest";
import { LIMITS, applyEvents } from "@/lib/carreteState";
import { ev, person, room } from "./fixtures";

const add = (id: string, name = id) => ev({ type: "ADD_PARTICIPANT", participant: person(id, { name }) });

describe("límites de datos en el reductor", () => {
  it("corta un nombre largo a 30 sin partir un emoji", () => {
    const s = applyEvents(room(), [add("a", `${"🎉".repeat(29)}AAAAAAAAAAAAAAA`)]);
    const chars = Array.from(s.participants[0].name);
    expect(chars).toHaveLength(LIMITS.name);
    expect(chars[0]).toBe("🎉");
  });

  it("acota montos", () => {
    const s = applyEvents(room(), [
      ev({ type: "ADD_EXPENSE", expense: { id: "e", payerId: "a", description: "x".repeat(200), amount: 1e12, category: "comun", at: 1 } as never }),
    ]);
    expect(s.split!.expenses[0].amount).toBe(LIMITS.amount);
    expect(s.split!.expenses[0].description.length).toBe(LIMITS.label);
  });

  it("corta canciones e ítems de la lista", () => {
    const s = applyEvents(room(), [
      ev({ type: "SONG_REQUEST", request: { id: "r", by: "a", text: "y".repeat(900), at: 1 } }),
      ev({ type: "ADD_BRING", item: { id: "h", label: "z".repeat(200) } }),
    ]);
    expect(s.music!.requests![0].text.length).toBe(LIMITS.text);
    expect(s.bring!.items[0].label.length).toBe(LIMITS.label);
  });

  it("no admite más personas que el máximo", () => {
    const s = applyEvents(room(), Array.from({ length: LIMITS.participants + 5 }, (_, i) => add(`p${i}`)));
    expect(s.participants).toHaveLength(LIMITS.participants);
  });
});
