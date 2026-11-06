import { describe, expect, it } from "vitest";
import { bacTone, hasAlcohol } from "@/lib/bacTone";

describe("tono de alcoholemia (reducción de daños)", () => {
  it("sin alcohol es calmo", () => expect(bacTone(0, false, false)).toBe("calm"));
  it("bajo 0,8 es cálido", () => expect(bacTone(0.4, false, true)).toBe("warm"));
  it("desde 0,8 es alto, nunca rojo de alarma", () => expect(bacTone(0.9, false, true)).toBe("high"));
  it("conductor sin alcohol queda en su estado propio", () => expect(bacTone(0, true, false)).toBe("driver-ok"));
  it("conductor que tomó es la única alerta", () => expect(bacTone(0.1, true, true)).toBe("driver-breach"));
});

describe("¿tomó alcohol? (para el tono del conductor)", () => {
  it("una cerveza 0.0 o un mezclador no cuentan; una piscola sí", () => {
    expect(hasAlcohol([{ id: "a", label: "Cerveza 0.0", ml: 350, abv: 0, ts: 1 }])).toBe(false);
    expect(hasAlcohol([])).toBe(false);
    expect(hasAlcohol([{ id: "b", label: "Piscola", ml: 300, abv: 0.1, ts: 1 }])).toBe(true);
  });
});
