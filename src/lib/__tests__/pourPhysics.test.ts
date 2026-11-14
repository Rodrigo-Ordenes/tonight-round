import { describe, expect, it } from "vitest";
import { approach, pourReadout, springStep, surfacePath } from "@/lib/pourPhysics";
import { scrambleFrame } from "@/lib/signalField";

describe("suavizado del scroll", () => {
  it("tras una vida media recorre la mitad", () => expect(approach(0, 1, 90, 90)).toBeCloseTo(0.5, 5));
  it("muy cerca del destino se fija", () => expect(approach(0.9999, 1, 16)).toBe(1));
  it("sin tiempo transcurrido no se mueve", () => expect(approach(0.2, 1, 0)).toBe(0.2));
});

describe("superficie del líquido", () => {
  it("con amplitud cero es plana a la altura pedida", () => {
    const d = surfacePath(50, 100, 200, 300, 1234, 0);
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toContain("NaN");
    const ys = Array.from(d.matchAll(/L ([\d.]+) ([\d.]+)/g)).map((m) => Number(m[2]));
    expect(ys.filter((y) => y < 300).every((y) => y === 200)).toBe(true);
  });
  it("con amplitud la onda se mantiene cerca del nivel", () => {
    const d = surfacePath(50, 100, 200, 300, 900, 4);
    const ys = Array.from(d.matchAll(/L ([\d.]+) ([\d.]+)/g)).map((m) => Number(m[2])).filter((y) => y < 300);
    expect(Math.max(...ys)).toBeLessThanOrEqual(204);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(196);
  });
});

describe("superficie inclinada", () => {
  it("con pendiente, un borde queda más alto que el otro y el centro en el nivel", () => {
    const d = surfacePath(0, 100, 200, 300, 0, 0, 0.1);
    const ys = Array.from(d.matchAll(/L (-?[\d.]+) (-?[\d.]+)/g)).map((m) => Number(m[2])).filter((y) => y < 300);
    expect(ys[0]).toBeCloseTo(195);
    expect(ys[6]).toBeCloseTo(200);
    expect(ys[ys.length - 1]).toBeCloseTo(205);
  });
});

describe("resorte del oleaje", () => {
  it("vuelve al reposo", () => {
    let s = { x: 0.3, v: 0 };
    for (let i = 0; i < 300; i++) s = springStep(s, 0, 16);
    expect(Math.abs(s.x)).toBeLessThan(0.01);
  });
  it("sin tiempo no cambia", () => expect(springStep({ x: 0.2, v: 1 }, 0, 0)).toEqual({ x: 0.2, v: 1 }));
  it("un salto de tiempo enorme no lo dispara", () => {
    const s = springStep({ x: 0.3, v: 0 }, 0, 5000);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(Math.abs(s.x)).toBeLessThanOrEqual(0.3);
  });
  it("sigue al objetivo", () => {
    let s = { x: 0, v: 0 };
    for (let i = 0; i < 300; i++) s = springStep(s, 0.2, 16);
    expect(s.x).toBeCloseTo(0.2, 2);
  });
});

describe("lecturas del trago", () => {
  it("una piscola servida: 60 ml de pisco, 140 de bebida, 10,5 % y 16,8 g", () => {
    const r = pourReadout({ pisco: 1, cola: 1 });
    expect(r).toMatchObject({ piscoMl: 60, colaMl: 140 });
    expect(r.abv).toBeCloseTo(0.105, 5);
    expect(r.grams).toBeCloseTo(16.8, 5);
  });
  it("vacío no tiene alcohol", () => expect(pourReadout({ pisco: 0, cola: 0 })).toEqual({ piscoMl: 0, colaMl: 0, abv: 0, grams: 0 }));
  it("solo pisco es 35 %", () => expect(pourReadout({ pisco: 1, cola: 0 }).abv).toBeCloseTo(0.35, 5));
});

describe("decodificación de palabras", () => {
  it("respeta espacios y minúsculas mientras decodifica", () => {
    const f = scrambleFrame("Hielo y pisco", 0.5, () => 0);
    expect(f).toHaveLength(13);
    expect(f[5]).toBe(" ");
    expect(f[7]).toBe(" ");
    expect(f.slice(8)).toMatch(/^[a-z]+$/);
  });
});
