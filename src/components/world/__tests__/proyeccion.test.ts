import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera } from "three";
import { edgeClamp, fitForAspect, projectBox, projectPoint, toolFrame, type Insets, type Viewport } from "../proyeccion";
import type { Viewpoint } from "../types";

// Una cámara de verdad (three) en el origen mirando hacia −Z, con 90° de lente y aspecto 1
function viewProj(fov = 90, aspect = 1) {
  const cam = new PerspectiveCamera(fov, aspect, 0.1, 100);
  cam.updateMatrixWorld();
  return new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).elements;
}
const VP: Viewport = { width: 300, height: 300 };
const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

describe("projectPoint", () => {
  const m = viewProj();
  it("lo que está justo enfrente cae al centro", () => {
    const p = projectPoint(m, [0, 0, -1], VP);
    expect(p.x).toBeCloseTo(150);
    expect(p.y).toBeCloseTo(150);
    expect(p.front).toBe(true);
    expect(p.inside).toBe(true);
  });
  it("a 45° a la derecha cae al borde derecho; arriba, al borde de arriba", () => {
    expect(projectPoint(m, [1, 0, -1], VP).x).toBeCloseTo(300);
    expect(projectPoint(m, [0, 1, -1], VP).y).toBeCloseTo(0);
  });
  it("fuera del lente queda fuera de la pantalla", () => {
    const p = projectPoint(m, [3, 0, -1], VP);
    expect(p.front).toBe(true);
    expect(p.inside).toBe(false);
    expect(p.x).toBeGreaterThan(300);
  });
  it("detrás de la cámara no está enfrente, y conserva hacia qué lado está", () => {
    const p = projectPoint(m, [2, 0, 1], VP);
    expect(p.front).toBe(false);
    expect(p.inside).toBe(false);
    expect(p.x).toBeGreaterThan(150);
  });
  it("reusa el objeto de salida (sin crear objetos por cuadro)", () => {
    const out = { x: 0, y: 0, front: false, inside: false };
    expect(projectPoint(m, [0, 0, -1], VP, out)).toBe(out);
  });
});

describe("projectBox", () => {
  const m = viewProj();
  it("una caja enfrente da su rectángulo en pantalla, centrado", () => {
    const r = projectBox(m, [0, 0, -2], [1, 1, 1], VP)!;
    // La cara de adelante (z = −1,5) manda: ±0,5/1,5 del lente → un tercio de la pantalla
    expect(r.x).toBeCloseTo(100);
    expect(r.y).toBeCloseTo(100);
    expect(r.width).toBeCloseTo(100);
    expect(r.height).toBeCloseTo(100);
  });
  it("una caja entera detrás de la cámara no tiene rectángulo", () => {
    expect(projectBox(m, [0, 0, 3], [1, 1, 1], VP)).toBeNull();
  });
});

describe("edgeClamp: un objeto fuera del cuadro se asoma por el borde", () => {
  const inset: Insets = { top: 60, right: 10, bottom: 90, left: 10 };
  const vp: Viewport = { width: 375, height: 812 };
  it("dentro del área útil no se mueve", () => {
    expect(edgeClamp({ x: 200, y: 400, front: true, inside: true }, vp, inset)).toEqual({ x: 200, y: 400, edge: false });
  });
  it("a la derecha fuera de pantalla queda pegado al borde derecho, a la misma altura del centro", () => {
    const cy = (60 + 28 + (812 - 90 - 28)) / 2;
    const r = edgeClamp({ x: 375 + 400, y: cy, front: true, inside: false }, vp, inset);
    expect(r.edge).toBe(true);
    expect(r.x).toBeCloseTo(375 - 10 - 28);
    expect(r.y).toBeCloseTo(cy);
  });
  it("debajo del dock sube hasta el área útil", () => {
    const r = edgeClamp({ x: 187.5, y: 2000, front: true, inside: false }, vp, inset);
    expect(r.y).toBeCloseTo(812 - 90 - 28);
  });
  it("muy cerca del borde, aunque esté en pantalla, entra completo", () => {
    const r = edgeClamp({ x: 370, y: 400, front: true, inside: true }, vp, inset);
    expect(r.edge).toBe(true);
    expect(r.x).toBeLessThanOrEqual(375 - 10 - 28 + 1e-9);
  });
  it("justo detrás de la cámara se asoma abajo (date vuelta)", () => {
    const r = edgeClamp({ x: 187.5, y: 406, front: false, inside: false }, vp, inset);
    expect(r.edge).toBe(true);
    expect(r.y).toBeCloseTo(812 - 90 - 28);
  });
  it("el margen se puede cambiar", () => {
    expect(edgeClamp({ x: 9999, y: 400, front: true, inside: false }, vp, NONE, 40).x).toBeCloseTo(375 - 40);
  });
});

describe("toolFrame: la herramienta se alinea sobre su objeto", () => {
  const safe: Insets = { top: 56, right: 0, bottom: 96, left: 0 };
  it("en el celular ocupa todo el ancho útil", () => {
    expect(toolFrame({ x: 100, y: 300, width: 80, height: 80 }, { width: 375, height: 812 }, safe)).toEqual({ x: 12, y: 68, width: 351, height: 812 - 56 - 96 - 24 });
  });
  it("en escritorio queda centrada en el objeto, entre 560 y 880 de ancho", () => {
    const r = toolFrame({ x: 570, y: 300, width: 300, height: 200 }, { width: 1440, height: 900 }, safe);
    expect(r.width).toBe(560);
    expect(r.x + r.width / 2).toBe(720);
    expect(r.y).toBe(68);
    expect(r.height).toBe(900 - 56 - 96 - 24);
    expect(toolFrame({ x: 0, y: 0, width: 2000, height: 10 }, { width: 1440, height: 900 }, safe).width).toBe(880);
  });
  it("al chocar con el borde se corre hacia adentro, sin salirse", () => {
    const r = toolFrame({ x: 1300, y: 300, width: 200, height: 200 }, { width: 1440, height: 900 }, safe);
    expect(r.x + r.width).toBe(1440 - 12);
  });
  it("sin objeto en pantalla queda al centro", () => {
    const r = toolFrame(null, { width: 1440, height: 900 }, safe);
    expect(r.x + r.width / 2).toBe(720);
  });
  it("si el espacio útil es más angosto que 560, no la deja más ancha que ese espacio", () => {
    const wide: Insets = { top: 56, right: 100, bottom: 96, left: 100 };
    const r = toolFrame({ x: 300, y: 0, width: 100, height: 100 }, { width: 700, height: 800 }, wide);
    expect(r.width).toBe(700 - 200 - 24);
    expect(r.x).toBe(112);
  });
});

describe("fitForAspect: en vertical cabe lo mismo de ancho", () => {
  const v: Viewpoint = { position: [0, 1.6, 4], target: [0, 1.2, 0], fov: 52 };
  it("con pantalla ancha no cambia nada", () => {
    expect(fitForAspect(v, 16 / 9)).toEqual(v);
    expect(fitForAspect(v, 2.4)).toEqual(v);
  });
  it("en el celular abre el lente hasta 72° y aleja la cámara hasta 1,8 veces por la misma recta", () => {
    const f = fitForAspect(v, 375 / 812);
    expect(f.fov).toBeCloseTo(72);
    const d0 = Math.hypot(v.position[0] - v.target[0], v.position[1] - v.target[1], v.position[2] - v.target[2]);
    const d1 = Math.hypot(f.position[0] - v.target[0], f.position[1] - v.target[1], f.position[2] - v.target[2]);
    expect(d1 / d0).toBeCloseTo(1.8);
    expect(f.target).toEqual(v.target);
    // La misma dirección de mirada
    expect((f.position[1] - v.target[1]) / (f.position[2] - v.target[2])).toBeCloseTo((v.position[1] - v.target[1]) / (v.position[2] - v.target[2]));
  });
  it("si alcanza con abrir el lente, no aleja", () => {
    const f = fitForAspect(v, 1.6);
    expect(f.fov).toBeGreaterThan(52);
    expect(f.fov).toBeLessThan(72);
    expect(f.position).toEqual(v.position);
  });
  it("nunca cierra un lente que ya era más abierto", () => {
    expect(fitForAspect({ ...v, fov: 80 }, 0.5).fov).toBe(80);
  });
});
