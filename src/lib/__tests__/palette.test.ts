import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apcaLc, wcagRatio } from "@/lib/contrast";
import { hexToRgb } from "@/lib/contrast";

// La fuente de verdad de la paleta es tailwind.config.js (docs/paleta-v11.md explica cada decisión)
const require = createRequire(import.meta.url);
const c = require("../../../tailwind.config.js").theme.extend.colors as Record<string, Record<string, string>>;
const WHITE = "#FFFFFF";

describe("paleta Brasa: contraste de texto (WCAG 2.2 AA y APCA)", () => {
  it.each([
    ["texto principal", c.slate[50], c.night[950], 90],
    ["texto principal en tarjeta elevada", c.slate[50], c.night[800], 85],
    ["texto secundario", c.slate[300], c.night[900], 60],
    ["texto de apoyo", c.slate[400], c.night[900], 60],
    ["metadatos", c.slate[500], c.night[850], 45],
    ["acento como texto", c.indigo[400], c.night[900], 55],
    ["en vivo como texto", c.emerald[300], c.night[900], 60],
    ["aviso como texto", c.amber[300], c.night[900], 60],
    ["alerta como texto", c.rose[300], c.night[900], 60],
  ])("%s pasa 4,5:1 y el mínimo APCA", (_label, fg, bg, lc) => {
    expect(wcagRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    expect(apcaLc(fg, bg)).toBeGreaterThanOrEqual(lc as number);
  });

  it("botón de marca: texto oscuro sobre 500", () => {
    expect(wcagRatio(c.night[950], c.indigo[500])).toBeGreaterThanOrEqual(4.5);
    expect(apcaLc(c.night[950], c.indigo[500])).toBeGreaterThanOrEqual(55);
  });

  it.each(["indigo", "emerald", "rose", "purple", "amber", "cyan"])("regla del sistema: %s-600 admite texto blanco (≥ 4,5:1)", (ramp) => {
    expect(wcagRatio(WHITE, c[ramp][600])).toBeGreaterThanOrEqual(4.5);
  });

  it("sin negro ni blanco puros en fondo y texto (evita el arrastre OLED y el halo con astigmatismo)", () => {
    expect(c.night[950]).not.toBe("#000000");
    expect(c.slate[50]).not.toBe("#FFFFFF");
  });

  it.each(["night", "slate", "indigo", "emerald", "amber", "rose", "purple", "cyan"])("la rampa %s oscurece paso a paso (50 → 950)", (ramp) => {
    const lum = (h: string) => hexToRgb(h).reduce((acc, v, i) => acc + [0.2126, 0.7152, 0.0722][i] * (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), 0);
    const steps = Object.entries(c[ramp]).sort((a, b) => +a[0] - +b[0]).map(([, h]) => lum(h));
    steps.slice(1).forEach((l, i) => expect(l).toBeLessThan(steps[i]));
  });
});

describe("higiene visual del código", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.name === "__tests__" ? [] : e.isDirectory() ? files(join(dir, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(dir, e.name)] : []
    );
  const src = join(__dirname, "..", "..");
  const having = (re: RegExp) => files(src).filter((f) => re.test(readFileSync(f, "utf8")));

  it("el botón de marca lleva texto oscuro, no blanco", () =>
    expect(having(/bg-(indigo-500|blue-500|carrete-primary|orange-500)(?![\/\w-])[^"`]*\btext-white\b|\btext-white\b[^"`]*bg-(indigo-500|blue-500|carrete-primary|orange-500)(?![\/\w-])/)).toEqual([]));
  it("no queda transition-all", () => expect(having(/transition-all/)).toEqual([]));
  it("las barras no animan el ancho", () => expect(having(/transition-\[width\]/)).toEqual([]));
  it("la corona ya no representa al conductor", () => expect(having(/\bCrown\b/)).toEqual([]));
  it("en la TV el texto de apoyo parte en 24 px", () => {
    const tvSm = require("../../../tailwind.config.js").theme.extend.fontSize["tv-sm"][0] as string;
    expect(tvSm).toContain("1.5rem");
    expect(readFileSync(join(src, "app/carrete/tv/page.tsx"), "utf8")).not.toMatch(/\btext-(sm|base|lg|xl)\b/);
  });
});
