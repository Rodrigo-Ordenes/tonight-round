import { describe, expect, it } from "vitest";
import { INTRO_GATE_SCRIPT, INTRO_SEEN_KEY } from "@/lib/introGate";

function runGate(storage: { getItem: (k: string) => string | null }) {
  const documentElement = { dataset: {} as Record<string, string> };
  new Function("localStorage", "document", INTRO_GATE_SCRIPT)(storage, { documentElement });
  return documentElement.dataset;
}

describe("compuerta de la intro", () => {
  it("si ya se vio, la apaga antes de pintar", () => {
    expect(runGate({ getItem: (k) => (k === INTRO_SEEN_KEY ? "1" : null) }).intro).toBe("off");
  });
  it("la primera vez la deja ver", () => {
    expect(runGate({ getItem: () => null }).intro).toBeUndefined();
  });
  it("sin almacenamiento no rompe la página", () => {
    expect(() =>
      runGate({
        getItem: () => {
          throw new Error("bloqueado");
        },
      })
    ).not.toThrow();
  });
});
