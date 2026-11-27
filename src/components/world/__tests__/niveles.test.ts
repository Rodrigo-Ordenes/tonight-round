import { describe, expect, it } from "vitest";
import { LEVEL_KEY, levelAfter, levelCeiling, parseLevel, shouldUpgrade, type DeviceCaps } from "../niveles";

const caps = (c: Partial<DeviceCaps>): DeviceCaps => ({ webgl: true, saveData: false, override: null, ...c });

describe("parseLevel", () => {
  it("lee solo 0, 1 o 2", () => {
    expect(parseLevel("0")).toBe(0);
    expect(parseLevel("1")).toBe(1);
    expect(parseLevel("2")).toBe(2);
    for (const raw of ["3", "", " 2", "dos", "-1", null, undefined]) expect(parseLevel(raw)).toBeNull();
  });
  it("la clave del navegador es tonight_mundo_nivel", () => {
    expect(LEVEL_KEY).toBe("tonight_mundo_nivel");
  });
});

describe("levelCeiling: hasta dónde intenta este equipo", () => {
  it("sin WebGL, el SectionStage de hoy, pida lo que pida", () => {
    expect(levelCeiling(caps({ webgl: false }))).toBe(0);
    expect(levelCeiling(caps({ webgl: false, override: 2 }))).toBe(0);
  });
  it("el nivel pedido manda (pruebas y modo tranquilo), incluso con ahorro de datos", () => {
    expect(levelCeiling(caps({ override: 0 }))).toBe(0);
    expect(levelCeiling(caps({ override: 1, saveData: true }))).toBe(1);
    expect(levelCeiling(caps({ override: 2, deviceMemory: 1 }))).toBe(2);
  });
  it("con ahorro de datos no baja texturas: nivel 0", () => {
    expect(levelCeiling(caps({ saveData: true }))).toBe(0);
  });
  it("un equipo justo (2 GB o 2 núcleos) parte en la foto con relieve", () => {
    expect(levelCeiling(caps({ deviceMemory: 2 }))).toBe(1);
    expect(levelCeiling(caps({ cores: 2 }))).toBe(1);
    expect(levelCeiling(caps({ deviceMemory: 0.5, cores: 8 }))).toBe(1);
  });
  it("el resto intenta el 3D completo (sin datos del equipo, también)", () => {
    expect(levelCeiling(caps({ deviceMemory: 4, cores: 8 }))).toBe(2);
    expect(levelCeiling(caps({}))).toBe(2);
  });
});

describe("levelAfter: lo que decide PerformanceMonitor", () => {
  it("en 0 no hay lienzo ni monitor: se queda en 0", () => {
    for (const e of ["decline", "incline", "fallback"] as const) expect(levelAfter(0, e, 2)).toBe(0);
  });
  it("si no alcanzan los cuadros, baja de a uno hasta el SectionStage", () => {
    expect(levelAfter(2, "decline", 2)).toBe(1);
    expect(levelAfter(1, "decline", 2)).toBe(0);
  });
  it("si sobran, sube de a uno sin pasar el techo", () => {
    expect(levelAfter(1, "incline", 2)).toBe(2);
    expect(levelAfter(2, "incline", 2)).toBe(2);
    expect(levelAfter(1, "incline", 1)).toBe(1);
  });
  it("si titubea demasiado, se queda en la foto con relieve", () => {
    expect(levelAfter(2, "fallback", 2)).toBe(1);
    expect(levelAfter(1, "fallback", 2)).toBe(1);
  });
});

describe("shouldUpgrade: el 3D entra sin cambiar nada bajo la mano", () => {
  it("espera a que la escena esté lista", () => {
    expect(shouldUpgrade({ ready: false, interacted: false, viewChanged: true })).toBe(false);
  });
  it("lista y sin que la persona haya tocado nada: entra", () => {
    expect(shouldUpgrade({ ready: true, interacted: false, viewChanged: false })).toBe(true);
  });
  it("si ya está usando el SectionStage, espera al próximo cambio de vista", () => {
    expect(shouldUpgrade({ ready: true, interacted: true, viewChanged: false })).toBe(false);
    expect(shouldUpgrade({ ready: true, interacted: true, viewChanged: true })).toBe(true);
  });
});
