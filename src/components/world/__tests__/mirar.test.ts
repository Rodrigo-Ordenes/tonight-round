import { describe, expect, it } from "vitest";
import { createLook, dragLook, LOOK_LIMIT, releaseLook, stepLook, tiltLook } from "../mirar";

const VP = { width: 1000, height: 800 };
const hfov = (fovDeg: number, aspect: number) => 2 * Math.atan(Math.tan((fovDeg * Math.PI) / 360) * aspect);
const run = (l: ReturnType<typeof createLook>, secs: number, reduce = false, each?: () => void) => {
  for (let t = 0; t < secs; t += 1 / 60) {
    stepLook(l, 1 / 60, reduce);
    each?.();
  }
};

describe("MIRAR con arrastre", () => {
  it("parte quieta, al centro", () => {
    expect(createLook()).toEqual({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, tYaw: 0, tPitch: 0, held: false });
  });
  it("LOOK_LIMIT es 25°", () => {
    expect(LOOK_LIMIT).toBeCloseTo((25 * Math.PI) / 180);
  });
  it("arrastrar a la derecha gira la mirada a la izquierda (la escena sigue al dedo), en proporción al lente", () => {
    const l = createLook();
    dragLook(l, 100, 0, VP, 52);
    expect(l.tYaw).toBeCloseTo(0.1 * hfov(52, 1.25));
    expect(l.tPitch).toBe(0);
    expect(l.held).toBe(true);
  });
  it("arrastrar hacia abajo mira hacia arriba", () => {
    const l = createLook();
    dragLook(l, 0, 80, VP, 52);
    expect(l.tPitch).toBeCloseTo(0.1 * ((52 * Math.PI) / 180));
  });
  it("se acumula y nunca pasa de ±25°", () => {
    const l = createLook();
    for (let i = 0; i < 50; i++) dragLook(l, 100, -100, VP, 52);
    expect(l.tYaw).toBeCloseTo(LOOK_LIMIT);
    expect(l.tPitch).toBeCloseTo(-LOOK_LIMIT);
    run(l, 3);
    expect(Math.abs(l.yaw)).toBeLessThanOrEqual(LOOK_LIMIT + 0.02);
  });
  it("al soltar vuelve al centro con resorte: se pasa un poco y se asienta", () => {
    const l = createLook();
    dragLook(l, 400, 0, VP, 52);
    run(l, 2);
    expect(l.yaw).toBeGreaterThan(0.2);
    releaseLook(l);
    expect(l.held).toBe(false);
    let min = Infinity;
    run(l, 2, false, () => (min = Math.min(min, l.yaw)));
    expect(min).toBeLessThan(-1e-4);
    expect(Math.abs(l.yaw)).toBeLessThan(0.001);
  });
  it("con movimiento reducido vuelve sin pasarse", () => {
    const l = createLook();
    dragLook(l, 400, 0, VP, 52);
    run(l, 2, true);
    releaseLook(l);
    let min = Infinity;
    run(l, 2, true, () => (min = Math.min(min, l.yaw)));
    expect(min).toBeGreaterThan(-1e-6);
    expect(Math.abs(l.yaw)).toBeLessThan(0.001);
  });
});

describe("MIRAR con el giroscopio", () => {
  it("inclinar a la derecha mira a la derecha; ±20° de lado es el tope", () => {
    const l = createLook();
    tiltLook(l, 10, 45);
    expect(l.tYaw).toBeCloseTo(-0.5 * LOOK_LIMIT);
    expect(l.tPitch).toBeCloseTo(0);
    tiltLook(l, 40, 45);
    expect(l.tYaw).toBeCloseTo(-LOOK_LIMIT);
  });
  it("la postura cómoda es 45° de frente; más erguido mira hacia arriba", () => {
    const l = createLook();
    tiltLook(l, 0, 65);
    expect(l.tPitch).toBeCloseTo(LOOK_LIMIT);
    tiltLook(l, 0, 35);
    expect(l.tPitch).toBeCloseTo(-0.5 * LOOK_LIMIT);
  });
  it("valores raros del sensor no rompen nada", () => {
    const l = createLook();
    tiltLook(l, Number.NaN, Number.NaN);
    expect(l.tYaw).toBe(0);
    expect(l.tPitch).toBe(0);
  });
});
