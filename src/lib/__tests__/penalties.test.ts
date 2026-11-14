import { describe, expect, it } from "vitest";
import { penaltyOptions } from "@/lib/liveGames";
import { BOMBA_CATEGORIAS, CASTIGOS, DUELOS, IMPOSTOR_WORDS, MIMICA, PREFIERES, PROBABLE, VERDAD_O_MITO, YO_NUNCA } from "@/data/party_prompts";
import { person } from "./fixtures";

const kinds = (p: ReturnType<typeof person>) => penaltyOptions(p, "r1", 3_600_000).map((o) => o.kind);
const heavy = [1, 2, 3, 4, 5, 6].map((i) => ({ id: `c${i}`, label: "x", ml: 300, abv: 0.14, ts: 0 }));

describe("alternativas al castigo", () => {
  it("quien toma poco elige: el reto, un sorbo, un shot chico, agua, una verdad o pasar", () => {
    expect(kinds(person("a"))).toEqual(["prenda", "sorbo", "shot", "agua", "verdad", "paso"]);
  });
  it("el conductor nunca ve alcohol", () => {
    expect(kinds(person("a", { role: "driver" }))).toEqual(["prenda", "agua", "verdad", "paso"]);
  });
  it("quien va alto tampoco ve sorbo ni shot", () => {
    const k = kinds(person("a", { consumptions: heavy }));
    expect(k).not.toContain("shot");
    expect(k).not.toContain("sorbo");
    expect(k).toContain("agua");
  });
  it("todas las opciones traen texto y siempre se puede pasar", () => {
    for (const o of penaltyOptions(person("a"), "r1", 0)) expect(o.text.length).toBeGreaterThan(3);
    expect(kinds(person("a", { role: "driver" }))).toContain("paso");
  });
  it("la misma ronda da las mismas opciones", () => {
    expect(penaltyOptions(person("a"), "r1", 0)).toEqual(penaltyOptions(person("a"), "r1", 0));
  });
});

describe("banco de preguntas", () => {
  const unique = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
  const yo = YO_NUNCA.flatMap((c) => c.items);
  it("trae suficiente variedad", () => {
    expect(yo.length).toBeGreaterThanOrEqual(170);
    expect(PROBABLE.length).toBeGreaterThanOrEqual(130);
    expect(PREFIERES.length).toBeGreaterThanOrEqual(100);
    expect(VERDAD_O_MITO.length).toBeGreaterThanOrEqual(50);
    expect(IMPOSTOR_WORDS.length).toBeGreaterThanOrEqual(12);
    for (const c of IMPOSTOR_WORDS) expect(c.words.length).toBeGreaterThanOrEqual(12);
    expect(BOMBA_CATEGORIAS.length).toBeGreaterThanOrEqual(80);
    expect(CASTIGOS.suaves.length).toBeGreaterThanOrEqual(28);
    expect(CASTIGOS.retos.length).toBeGreaterThanOrEqual(30);
    expect(CASTIGOS.verdades.length).toBeGreaterThanOrEqual(30);
    expect(CASTIGOS.sinAlcohol.length).toBeGreaterThanOrEqual(20);
    expect(DUELOS.length).toBeGreaterThanOrEqual(40);
    expect(MIMICA.flatMap((c) => c.words).length).toBeGreaterThanOrEqual(80);
  });
  it("no repite preguntas", () => {
    unique(yo);
    unique(PROBABLE);
    unique(PREFIERES.map((p) => `${p.a}|${p.b}`));
    unique(VERDAD_O_MITO.map((m) => m.text));
    unique(BOMBA_CATEGORIAS);
    unique(Object.values(CASTIGOS).flat());
    unique(DUELOS);
    unique(MIMICA.flatMap((c) => c.words));
    for (const c of IMPOSTOR_WORDS) unique(c.words);
  });
  it("cada mito explica su respuesta", () => {
    for (const m of VERDAD_O_MITO) expect(m.explain.length).toBeGreaterThan(15);
  });
});
