import { describe, expect, it } from "vitest";
import { bacTone } from "@/lib/bacTone";

describe("tono de alcoholemia (reducción de daños)", () => {
  it("sin alcohol es calmo", () => expect(bacTone(0, false, false)).toBe("calm"));
  it("bajo 0,8 es cálido", () => expect(bacTone(0.4, false, true)).toBe("warm"));
  it("desde 0,8 es alto, nunca rojo de alarma", () => expect(bacTone(0.9, false, true)).toBe("high"));
  it("conductor sin alcohol queda en su estado propio", () => expect(bacTone(0, true, false)).toBe("driver-ok"));
  it("conductor que tomó es la única alerta", () => expect(bacTone(0.1, true, true)).toBe("driver-breach"));
});
