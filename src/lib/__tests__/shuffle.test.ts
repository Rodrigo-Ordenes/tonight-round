import { describe, expect, it } from "vitest";
import { groupCountFor, makeGroups, seatPool } from "@/lib/shuffle";

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

describe("cantidad de grupos por modo", () => {
  it.each([3, 4, 5, 6, 7])("dos equipos con %i personas son siempre dos", (n) => {
    const g = makeGroups(ids(n), groupCountFor("equipos", n), 3);
    expect(g).toHaveLength(2);
    expect(flat(g)).toEqual(ids(n).sort());
  });

  it("tríos con 5 personas: dos grupos (3 y 2), no uno de 5", () => {
    expect(makeGroups(ids(5), groupCountFor("trios", 5), 3).map((g) => g.length).sort()).toEqual([2, 3]);
  });

  it("parejas con 5: dos grupos; puestos: un solo orden; con 1 persona, un grupo", () => {
    expect(groupCountFor("parejas", 5)).toBe(2);
    expect(groupCountFor("puestos", 8)).toBe(1);
    expect(groupCountFor("equipos", 1)).toBe(1);
    expect(groupCountFor("parejas", 1)).toBe(1);
  });
});

describe("quién entra al sorteo", () => {
  it("quien va en camino o ya llegó a casa no queda en un equipo", () => {
    const people = [{ id: "a", status: "party" }, { id: "b", status: "safe" }, { id: "c", status: "transit" }] as const;
    expect(seatPool(people as never)).toEqual(["a"]);
  });
});
