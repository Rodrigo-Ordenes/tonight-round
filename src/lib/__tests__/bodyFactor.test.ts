import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_FACTOR, bodyFactorFrom, computeBac, widmarkR } from "@/lib/alcohol";
import { applyEvents, mergeCarrete, normalizeParticipant, type Participant } from "@/lib/carreteState";
import { ev, person, room } from "./fixtures";

const legacy = (over: object) => ({ ...person("ana"), bodyFactor: undefined, ...over }) as unknown as Participant;
const drinks = [{ id: "a", label: "x", ml: 300, abv: 0.12, ts: 0 }];
const bac = (volume: number) => computeBac(drinks, volume, 3_600_000).bac;

describe("factor corporal en vez de peso y sexo", () => {
  it("redondea los litros de distribución a pares", () => {
    expect(bodyFactorFrom("M", 75)).toBe(52);
    expect(bodyFactorFrom("F", 60) % 2).toBe(0);
  });

  it("acota el factor con pesos imposibles", () => {
    expect(bodyFactorFrom("F", 1)).toBeGreaterThanOrEqual(16);
    expect(bodyFactorFrom("M", 999)).toBeLessThanOrEqual(180);
  });

  it("la estimación cambia a lo más 4 % en pesos habituales", () => {
    for (const g of ["M", "F"] as const)
      for (let kg = 50; kg <= 100; kg++) {
        const exact = bac(widmarkR(g) * kg);
        expect(Math.abs(bac(bodyFactorFrom(g, kg)) - exact) / exact).toBeLessThanOrEqual(0.04);
      }
  });

  it("convierte a quien venía con peso y sexo, y los borra", () => {
    const p = normalizeParticipant(legacy({ weightKg: 80, gender: "F" })) as unknown as Record<string, unknown>;
    expect(p.bodyFactor).toBe(bodyFactorFrom("F", 80));
    expect(p).not.toHaveProperty("weightKg");
    expect(p).not.toHaveProperty("gender");
  });

  it("sin factor ni datos antiguos usa el valor por defecto", () => {
    expect(normalizeParticipant(legacy({})).bodyFactor).toBe(DEFAULT_BODY_FACTOR);
  });

  it("una copia vieja por anti-entropía no deja peso en el servidor", () => {
    const server = applyEvents(room(), [ev({ type: "ADD_PARTICIPANT", participant: person("ana") })]);
    const stale = { ...server, participants: [legacy({ weightKg: 80, gender: "F", updatedAt: 99 })] };
    for (const p of mergeCarrete(server, stale, "a").participants) expect(p).not.toHaveProperty("weightKg");
  });

  it("ni un alta ni un parche pueden guardar peso", () => {
    const add = ev({ type: "ADD_PARTICIPANT", participant: legacy({ weightKg: 70, gender: "M" }) });
    const s1 = applyEvents(room(), [add]);
    expect(s1.participants[0]).not.toHaveProperty("weightKg");
    const s2 = applyEvents(s1, [ev({ type: "PATCH_PARTICIPANT", id: "ana", patch: { weightKg: 90 } as never })]);
    expect(s2.participants[0]).not.toHaveProperty("weightKg");
  });
});
