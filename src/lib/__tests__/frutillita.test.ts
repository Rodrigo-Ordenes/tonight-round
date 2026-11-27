import { describe, expect, it } from "vitest";
import { ANILLO, LINEAS, frutillitaSpin, lineWin } from "@/lib/frutillita";

describe("La Frutillita 5×3", () => {
  it("la misma semilla y el mismo jugador dan la misma tirada (TV y celular ven lo mismo)", () => {
    expect(frutillitaSpin(123, "ana")).toEqual(frutillitaSpin(123, "ana"));
    expect(frutillitaSpin(123, "ana").grid).not.toEqual(frutillitaSpin(123, "beto").grid);
  });

  it("5 rodillos de 3 y 9 líneas que recorren los 5 rodillos", () => {
    const r = frutillitaSpin(7, "a");
    expect(r.grid).toHaveLength(5);
    r.grid.forEach((reel) => expect(reel).toHaveLength(3));
    expect(LINEAS).toHaveLength(9);
    LINEAS.forEach((l) => expect(l).toHaveLength(5));
  });

  it("paga frutas iguales seguidas desde la izquierda y el logo reemplaza a cualquiera", () => {
    expect(lineWin(["limon", "limon", "limon", "uva", "uva"])).toMatchObject({ fruta: "limon", count: 3 });
    expect(lineWin(["logo", "limon", "limon", "cereza", "uva"])).toMatchObject({ fruta: "limon", count: 3 });
    expect(lineWin(["uva", "limon", "limon", "limon", "limon"])).toBeNull();
    expect(lineWin(["cereza", "cereza", "uva", "uva", "uva"])).toMatchObject({ fruta: "cereza", count: 2 });
    // La frutilla es dispersa: no paga en línea
    expect(lineWin(["frutilla", "frutilla", "frutilla", "uva", "uva"])).toBeNull();
  });

  it("solo cuentan las líneas activas y la apuesta por línea multiplica el premio", () => {
    for (let k = 1; k < 400; k++) {
      const una = frutillitaSpin(k, "a", 1, 1);
      expect(una.wins.every((w) => w.line === 0)).toBe(true);
      const doble = frutillitaSpin(k, "a", 9, 2);
      const simple = frutillitaSpin(k, "a", 9, 1);
      expect(doble.win).toBe(simple.win * 2);
    }
  });

  it("La vuelta: con 3 frutillas o más, la luz corre hasta SALIDA y solo paga lo que coincide con el centro", () => {
    let seen = 0;
    for (let k = 1; k < 3000 && seen < 30; k++) {
      const r = frutillitaSpin(k, "a");
      if (r.frutillas < 3) {
        expect(r.vueltas).toHaveLength(0);
        continue;
      }
      seen++;
      const rondas = Math.min(3, r.frutillas - 2);
      expect(new Set(r.vueltas.map((v) => v.ronda)).size).toBe(rondas);
      for (const v of r.vueltas) {
        expect(ANILLO[v.index]).toBe(v.casilla);
        if (v.casilla === "salida") expect(v.pay).toBe(0);
        else expect(v.pay > 0).toBe(v.inner.includes(v.casilla));
      }
      expect(r.bonus).toBe(r.vueltas.reduce((a, v) => a + v.pay, 0));
    }
    expect(seen).toBeGreaterThan(10);
  });

  it("paga como una máquina real: entre 85 % y 110 % de lo apostado", () => {
    let win = 0;
    const n = 6000;
    for (let k = 1; k <= n; k++) win += frutillitaSpin(k * 7919, "x", 9, 1).win;
    const rtp = win / (n * 9);
    expect(rtp).toBeGreaterThan(0.85);
    expect(rtp).toBeLessThan(1.1);
  });
});
