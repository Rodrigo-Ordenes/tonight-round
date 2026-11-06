import { describe, expect, it } from "vitest";
import { makeGroups } from "@/lib/shuffle";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
const flat = (g: string[][]) => g.flat().sort();

describe("rotación de puestos y equipos", () => {
  it.each([1, 2, 7, 10])("con %i personas nadie se repite ni se pierde", (n) => {
    const g = makeGroups(ids(n), 2, 42);
    expect(flat(g)).toEqual(ids(n).sort());
  });

  it("los grupos difieren en tamaño a lo más en 1", () => {
    const sizes = makeGroups(ids(7), 3, 7).map((g) => g.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("la misma semilla da el mismo sorteo (TV y celulares coinciden)", () => {
    expect(makeGroups(ids(8), 2, 99)).toEqual(makeGroups(ids(8), 2, 99));
  });

  it("semillas distintas cambian el orden", () => {
    expect(makeGroups(ids(8), 2, 1)).not.toEqual(makeGroups(ids(8), 2, 2));
  });
});
