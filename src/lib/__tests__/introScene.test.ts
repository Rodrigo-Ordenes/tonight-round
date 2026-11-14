import { describe, expect, it } from "vitest";
import { CLINK_AT, COUNTER_Y, NODE_POS, NOZZLE_Y, PARK_X, READY_AT, ROUND, SHAPES, dropletAt, levelLocal, sceneAt, toWorld } from "@/lib/introScene";

/** Esquina del borde de un vaso en el mundo (lado +1 derecha, -1 izquierda). */
const rim = (p: number, i: number, side: 1 | -1) => {
  const kind = ROUND[i].kind;
  return toWorld(sceneAt(p).glasses[i], kind, side * SHAPES[kind].rim, -SHAPES[kind].height);
};

describe("la ronda: arranque", () => {
  it("cuatro vasos vacíos sobre la barra y el dispensador sobre el primero", () => {
    const s = sceneAt(0);
    expect(s.glasses.map((g) => g.x)).toEqual(PARK_X);
    s.glasses.forEach((g, i) => {
      expect(g.fill).toBe(0);
      expect(toWorld(g, ROUND[i].kind, 0, 0).y).toBeCloseTo(COUNTER_Y);
    });
    expect(s.head.x).toBe(PARK_X[0]);
    expect(s.label).toBe("Sirve la ronda");
    expect(s.hint).toBe("scroll");
    expect(s.readout).toBeNull();
    expect(s.stream).toBeNull();
  });

  it("fuera de rango se comporta como los extremos", () => {
    expect(sceneAt(-1)).toEqual(sceneAt(0));
    expect(sceneAt(2)).toEqual(sceneAt(1));
  });
});

describe("servir", () => {
  it("el pisco cae sobre el primer vaso y se lee a 35 %", () => {
    const s = sceneAt(0.145);
    expect(s.stream?.liquid).toBe("pisco");
    expect(s.stream?.x).toBe(PARK_X[0]);
    expect(s.readout?.drink).toBe(0);
    expect(s.readout?.abv).toBeCloseTo(0.35, 5);
  });

  it("el chorro sale de la boquilla, llega al líquido y se corta desde arriba", () => {
    const start = sceneAt(0.121).stream!;
    expect(start.top).toBe(NOZZLE_Y);
    expect(start.bottom).toBeLessThan(150);
    const s = sceneAt(0.145);
    const g = s.glasses[0];
    expect(s.stream!.bottom).toBeCloseTo(toWorld(g, "highball", 0, levelLocal("highball", g.fill)).y, 5);
    expect(sceneAt(0.1695).stream!.top).toBeGreaterThan(NOZZLE_Y + 100);
  });

  it.each([
    [0.25, 0, 200, 0.105, 16.8],
    [0.38, 1, 350, 0.05, 14],
    [0.49, 2, 150, 0.13, 15.6],
    [0.59, 3, 250, 0, 0],
  ])("en %s el trago %s queda con %s ml, %s y %s g", (p, drink, ml, abv, grams) => {
    const r = sceneAt(p).readout!;
    expect(r.drink).toBe(drink);
    expect(r.ml).toBe(ml);
    expect(r.abv).toBeCloseTo(abv, 5);
    expect(r.grams).toBeCloseTo(grams, 5);
  });

  it("el dispensador viaja de un vaso al siguiente", () => {
    expect(sceneAt(0.2).head.x).toBe(PARK_X[0]);
    const mid = sceneAt(0.26).head.x;
    expect(mid).toBeGreaterThan(PARK_X[0]);
    expect(mid).toBeLessThan(PARK_X[1]);
    expect(sceneAt(0.32).head.x).toBe(PARK_X[1]);
  });

  it("las etiquetas cuentan la historia", () => {
    expect([0, 0.1, 0.3, 0.42, 0.53, 0.66, 0.8].map((p) => sceneAt(p).label)).toEqual([
      "Sirve la ronda",
      "Piscola",
      "Cerveza",
      "Vino",
      "Agua",
      "¡Salud!",
      "La noche, en vivo",
    ]);
  });
});

describe("brindis", () => {
  it("en el choque el borde de cada vaso toca el del vecino", () => {
    for (let i = 0; i < 3; i++) expect(Math.abs(rim(CLINK_AT, i + 1, -1).x - rim(CLINK_AT, i, 1).x)).toBeLessThan(4);
  });

  it("el choque marca un antes y un después", () => {
    expect(sceneAt(CLINK_AT - 0.001).clink).toBe(false);
    expect(sceneAt(CLINK_AT).clink).toBe(true);
  });

  it("las gotas saltan, caen y desaparecen", () => {
    const a = dropletAt(0, 0)!;
    const b = dropletAt(0, 200)!;
    const c = dropletAt(0, 700)!;
    expect(a.o).toBe(1);
    expect(b.y).toBeLessThan(a.y);
    expect(c.y).toBeGreaterThan(b.y);
    expect(dropletAt(0, 2000)).toBeNull();
  });
});

describe("la señal", () => {
  it("al final cada vaso es un celular conectado a la tele", () => {
    const s = sceneAt(1);
    s.glasses.forEach((g, i) => {
      expect(g.x).toBeCloseTo(NODE_POS[i].x);
      expect(g.y).toBeCloseTo(NODE_POS[i].y);
      expect(g.outline).toBe(0);
      expect(g.node).toBe(1);
    });
    expect(s.lines.every((l) => l === 1)).toBe(true);
    expect(s.hub).toBe(1);
    expect(s.hint).toBe("network");
  });

  it("la acción final aparece solo al terminar", () => {
    expect(sceneAt(READY_AT - 0.005).ready).toBe(false);
    expect(sceneAt(READY_AT).ready).toBe(true);
  });
});

describe("continuidad", () => {
  it("ningún vaso ni el dispensador saltan entre pasos chicos de scroll", () => {
    let prev = sceneAt(0);
    for (let i = 1; i <= 1000; i++) {
      const s = sceneAt(i / 1000);
      s.glasses.forEach((g, j) => {
        expect(Math.abs(g.x - prev.glasses[j].x)).toBeLessThan(6);
        expect(Math.abs(g.y - prev.glasses[j].y)).toBeLessThan(6);
        expect(Math.abs(g.rot - prev.glasses[j].rot)).toBeLessThan(2);
        expect(Math.abs(g.fill - prev.glasses[j].fill)).toBeLessThan(0.05);
      });
      expect(Math.abs(s.head.x - prev.head.x)).toBeLessThan(6);
      prev = s;
    }
  });
});
