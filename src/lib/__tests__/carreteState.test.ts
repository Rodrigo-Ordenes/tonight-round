import { describe, expect, it } from "vitest";
import { applyEvent, applyEvents, mergeCarrete } from "@/lib/carreteState";
import { ev, person, room } from "./fixtures";

const withJuan = () => applyEvent(room(), ev({ type: "ADD_PARTICIPANT", participant: person("juan") }));
const drink = (i: number) =>
  ev({ type: "LOG_DRINK", eventId: `d${i}`, participantId: "juan", consumption: { id: `c${i}`, label: "Piscola", ml: 60, abv: 0.35, ts: i } });

describe("reductor del carrete", () => {
  it("20 tragos con eventId distinto quedan todos registrados", () => {
    const s = applyEvents(withJuan(), Array.from({ length: 20 }, (_, i) => drink(i)));
    expect(s.participants[0].consumptions).toHaveLength(20);
  });

  it("reaplicar el mismo eventId no duplica el trago", () => {
    const s = applyEvents(withJuan(), [drink(1), drink(1), drink(1)]);
    expect(s.participants[0].consumptions).toHaveLength(1);
  });

  it("un evento repetido queda una sola vez en el registro de vistos", () => {
    const d = drink(7);
    const s = applyEvents(withJuan(), [d, d]);
    expect(s.seen!.filter((x) => x === d.eventId)).toHaveLength(1);
  });

  it("un estado viejo no resucita tragos después de reiniciar consumos", () => {
    const before = applyEvents(withJuan(), [drink(1), drink(2)]);
    const reset = applyEvent(before, ev({ type: "RESET_CONSUMPTIONS" }));
    const merged = mergeCarrete(reset, before);
    expect(merged.participants[0].consumptions).toHaveLength(0);
  });
});
