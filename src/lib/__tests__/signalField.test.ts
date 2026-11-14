import { describe, expect, it } from "vitest";
import { HUB, MAX_NODES, assignSlots, burstTargets, layoutField, nodeDrift, pulseProgress, scrambleFrame, shotProgress, unseenEvents } from "@/lib/signalField";

describe("red de señal", () => {
  it("la misma semilla dibuja la misma red", () => expect(layoutField(8, 42)).toEqual(layoutField(8, 42)));
  it("otra semilla cambia la red", () => expect(layoutField(8, 1)).not.toEqual(layoutField(8, 2)));

  it("los nodos quedan dentro y separados de la pantalla central", () => {
    for (const n of layoutField(24, 7)) {
      expect(n.x).toBeGreaterThanOrEqual(0.03);
      expect(n.x).toBeLessThanOrEqual(0.97);
      expect(n.y).toBeGreaterThanOrEqual(0.06);
      expect(n.y).toBeLessThanOrEqual(0.94);
      expect(Math.hypot(n.x - HUB.x, n.y - HUB.y)).toBeGreaterThan(0.12);
    }
  });

  it("acepta cero personas y limita salas enormes", () => {
    expect(layoutField(0, 1)).toEqual([]);
    expect(layoutField(500, 1)).toHaveLength(MAX_NODES);
  });

  it("agregar a alguien no mueve a quienes ya estaban", () => {
    expect(layoutField(6, 9).slice(0, 5)).toEqual(layoutField(5, 9));
  });

  it("el movimiento de cada nodo es mínimo", () => {
    const d = nodeDrift(3, 12_345);
    expect(Math.abs(d.x)).toBeLessThanOrEqual(0.008);
    expect(Math.abs(d.y)).toBeLessThanOrEqual(0.008);
  });

  it("la señal recorre el enlace y descansa entre viajes", () => {
    const period = 4000;
    expect(pulseProgress(0, 0, period)).toBe(0);
    expect(pulseProgress(0, 900, period)).toBeGreaterThan(0.5);
    expect(pulseProgress(0, 3500, period)).toBeNull();
    expect(pulseProgress(0, 900 + period, period)).toBeCloseTo(pulseProgress(0, 900, period)!);
  });
});

describe("decodificación del código", () => {
  const rand = () => 0;
  it("al terminar muestra el código exacto", () => expect(scrambleFrame("ABCDEF", 1, rand)).toBe("ABCDEF"));
  it("al empezar no revela ningún carácter", () => {
    const f = scrambleFrame("ZZZZZZ", 0, rand);
    expect(f).toHaveLength(6);
    expect(f).not.toContain("Z");
  });
  it("revela de izquierda a derecha sin cambiar el largo", () => {
    const f = scrambleFrame("ZZZZZZ", 0.5, rand);
    expect(f.startsWith("ZZZ")).toBe(true);
    expect(f).toHaveLength(6);
  });
});

describe("señales a pedido", () => {
  it("cada unidad nueva dispara un celular distinto y en orden", () => {
    expect(burstTargets(0, 3, 14)).toEqual([1, 2, 3]);
  });
  it("subir tantas unidades como celulares los dispara a todos una vez", () => {
    expect(new Set(burstTargets(3, 17, 14)).size).toBe(14);
  });
  it("sin celulares o sin cambio no dispara nada", () => {
    expect(burstTargets(0, 5, 0)).toEqual([]);
    expect(burstTargets(4, 4, 10)).toEqual([]);
    expect(burstTargets(6, 2, 10)).toEqual([]);
  });
  it("un salto enorme queda acotado", () => {
    expect(burstTargets(0, 10_000, 8).length).toBeLessThanOrEqual(16);
  });
  it("la señal avanza frenando y desaparece al llegar", () => {
    expect(shotProgress(1000, 900, 800)).toBeNull();
    expect(shotProgress(1000, 1000, 800)).toBe(0);
    expect(shotProgress(1000, 1400, 800)!).toBeGreaterThan(0.8);
    expect(shotProgress(1000, 1801, 800)).toBeNull();
  });
});

describe("red de personas en la TV", () => {
  it("cada persona toma un lugar y lo conserva cuando llegan otras", () => {
    const a = assignSlots(new Map(), ["ana", "beto"], 24);
    expect([...a]).toEqual([["ana", 0], ["beto", 1]]);
    const b = assignSlots(a, ["ana", "beto", "caro"], 24);
    expect(b.get("ana")).toBe(0);
    expect(b.get("beto")).toBe(1);
    expect(b.get("caro")).toBe(2);
  });
  it("quien se va libera su lugar para el siguiente que llega", () => {
    const a = assignSlots(new Map(), ["ana", "beto", "caro"], 24);
    const b = assignSlots(a, ["ana", "caro", "dani"], 24);
    expect(b.get("dani")).toBe(1);
    expect(b.has("beto")).toBe(false);
    expect(b.get("caro")).toBe(2);
  });
  it("una sala enorme no pasa del máximo de lugares", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `p${i}`);
    const slots = assignSlots(new Map(), ids, 24);
    expect(slots.size).toBe(24);
    expect(Math.max(...slots.values())).toBe(23);
  });
  it("solo los eventos no vistos generan señal", () => {
    const ev = [
      { key: "a", participantId: "ana", kind: "drink" as const, at: 1 },
      { key: "b", participantId: "ana", kind: "water" as const, at: 2 },
    ];
    expect(unseenEvents(new Set(["a"]), ev).map((e) => e.key)).toEqual(["b"]);
    expect(unseenEvents(new Set(["a", "b"]), ev)).toEqual([]);
  });
});
