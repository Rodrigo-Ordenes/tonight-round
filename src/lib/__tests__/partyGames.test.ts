import { describe, expect, it } from "vitest";
import {
  PARTY_GAMES,
  cajas,
  casillaMaldita,
  cronometroTarget,
  dados,
  leaderboard,
  mayorMenorCards,
  proximidadNumber,
  resolveParty,
  ultimoPasos,
} from "@/lib/partyGames";
import { buildRound, revealAction, tally } from "@/lib/liveGames";
import { applyEvent, emptyCarrete, type LiveGame, type LiveRound } from "@/lib/carreteState";
import { person } from "./fixtures";

const people = ["a", "b", "c", "d"].map((id) => person(id));
const v = (value: string) => ({ value, at: 1 });
const round = (game: LiveGame, over: Partial<LiveRound> = {}): LiveRound => ({ id: "r1", game, prompt: "", options: [], startedAt: 1, votes: {}, seed: 1234, ...over });

describe("Party Games: azar con semilla", () => {
  it("la misma semilla da el mismo resultado en la TV y en cada celular", () => {
    expect(proximidadNumber(99)).toBe(proximidadNumber(99));
    expect(dados(99)).toEqual(dados(99));
    expect(cajas(99)).toEqual(cajas(99));
    expect(ultimoPasos(99)).toEqual(ultimoPasos(99));
  });

  it("los rangos se respetan", () => {
    for (let s = 1; s < 300; s++) {
      const n = proximidadNumber(s);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
      const [x, y] = dados(s);
      expect(x).toBeGreaterThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(6);
      const t = cronometroTarget(s);
      expect(t).toBeGreaterThanOrEqual(5000);
      expect(t).toBeLessThanOrEqual(12000);
      expect(casillaMaldita(s)).toBeGreaterThanOrEqual(1);
      expect(casillaMaldita(s)).toBeLessThanOrEqual(9);
      const { first } = mayorMenorCards(s);
      expect(first.rank).toBeGreaterThan(2);
      expect(first.rank).toBeLessThan(14);
    }
  });

  it("las seis cajas traen siempre los mismos premios, en otro orden", () => {
    expect(cajas(5).map((c) => c.points).sort((a, b) => a - b)).toEqual([-5, 5, 10, 15, 20, 30]);
  });
});

describe("Party Games: resolución", () => {
  it("ruleta de proximidad: empate en la menor diferencia comparte el triunfo", () => {
    const n = proximidadNumber(1234);
    const r = round("proximidad", { votes: { a: v(String(n - 2)), b: v(String(n + 2)), c: v(String(n > 50 ? 0 : 100)) } });
    const res = resolveParty(r, people);
    expect(res.winnerIds.sort()).toEqual(["a", "b"]);
    expect(res.loserIds).toEqual(["c"]);
    expect(res.points.a).toBe(20);
  });

  it("acertar el número exacto paga doble", () => {
    const n = proximidadNumber(1234);
    const res = resolveParty(round("proximidad", { votes: { a: v(String(n)) } }), people);
    expect(res.points.a).toBe(40);
  });

  it("dado misterioso: los dobles pagan 30 y la suma correcta 10", () => {
    const seed = Array.from({ length: 500 }, (_, i) => i).find((s) => dados(s)[0] === dados(s)[1])!;
    const [x] = dados(seed);
    const range = x * 2 <= 5 ? "low" : x * 2 <= 8 ? "mid" : "high";
    const res = resolveParty(round("dados", { seed, votes: { a: v("double"), b: v(range) } }), people);
    expect(res.points.a).toBe(30);
    expect(res.points.b).toBe(10);
  });

  it("casilla maldita: quien cae resta 5 y cumple", () => {
    const bad = casillaMaldita(1234);
    const safe = bad === 1 ? 2 : 1;
    const res = resolveParty(round("casilla", { votes: { a: v(String(bad)), b: v(String(safe)) } }), people);
    expect(res.loserIds).toEqual(["a"]);
    expect(res.points).toEqual({ a: -5, b: 10 });
  });

  it("el mentiroso gana si nadie lo descubre", () => {
    const r = round("mentiroso", { answer: "d", votes: { a: v("b"), b: v("c"), c: v("a") } });
    const res = resolveParty(r, people);
    expect(res.points.d).toBe(30);
    expect(res.loserIds.sort()).toEqual(["a", "b", "c"]);
  });

  it("si lo descubren, suman quienes votaron bien y cumple el mentiroso", () => {
    const r = round("mentiroso", { answer: "d", votes: { a: v("d"), b: v("d"), c: v("a") } });
    const res = resolveParty(r, people);
    expect(res.loserIds).toEqual(["d"]);
    expect(res.points).toEqual({ a: 10, b: 10 });
  });

  it("la mayoría gana: suma quien predijo la alternativa más elegida", () => {
    const r = round("mayoria", {
      options: ["Playa", "Piscina", "Casa", "Disco"].map((label, i) => ({ id: "abcd"[i], label })),
      votes: { a: v("b|b"), b: v("a|b"), c: v("b|c"), d: v("c|b") },
    });
    const res = resolveParty(r, people);
    expect(res.points).toEqual({ a: 10, c: 10 });
  });

  it("predice el porcentaje: gana quien queda más cerca del porcentaje real", () => {
    const r = round("porcentaje", { votes: { a: v("50|si"), b: v("90|no"), c: v("10|si"), d: v("40|no") } });
    const res = resolveParty(r, people);
    expect(res.outcome).toBe("50 %");
    expect(res.winnerIds).toEqual(["a"]);
  });

  it("no te adelantes: quien se adelanta queda descalificado", () => {
    const res = resolveParty(round("reflejos", { votes: { a: v("230"), b: v("early"), c: v("310") } }), people);
    expect(res.winnerIds).toEqual(["a"]);
    expect(res.loserIds).toEqual(["b"]);
    expect(res.points.b).toBe(-5);
  });

  it("último en pie: gana quien llegó más lejos", () => {
    const res = resolveParty(round("ultimo", { votes: { a: v("7"), b: v("12"), c: v("2") } }), people);
    expect(res.winnerIds).toEqual(["b"]);
    expect(res.loserIds).toEqual(["c"]);
  });
});

describe("Party Games: rondas, revelado y ranking", () => {
  it("cada juego del catálogo arma su ronda con semilla y tiempo", () => {
    for (const g of PARTY_GAMES) {
      const r = buildRound(g.id, { participants: people, confessions: [], usedPrompts: new Set() });
      expect("error" in r ? r.error : "").toBe("");
      if (!("error" in r)) {
        expect(r.durationMs).toBe(g.seconds * 1000);
        if (g.id !== "probable") expect(typeof r.seed).toBe("number");
      }
    }
  });

  it("el revelado guarda los puntos y el ranking los suma", () => {
    const bad = casillaMaldita(1234);
    const r = round("casilla", { votes: { a: v(String(bad)), b: v(String(bad === 1 ? 2 : 1)) } });
    const action = revealAction(r, people);
    expect(action.points).toEqual({ a: -5, b: 10 });
    expect(leaderboard([{ points: { a: -5, b: 10 } }, { points: { a: 20 } }], people)).toEqual([
      { id: "a", name: people[0].name, points: 15 },
      { id: "b", name: people[1].name, points: 10 },
    ]);
  });

  it("¿Quién es más probable? suma 5 a quien votó con la mayoría", () => {
    const r = round("probable", { options: people.map((p) => ({ id: p.id, label: p.name })), votes: { a: v("c"), b: v("c"), c: v("a") } });
    expect(tally(r, people).points).toEqual({ a: 5, b: 5 });
  });

  it("en los juegos de tiempo vale el primer intento", () => {
    let s = emptyCarrete("ABCDEF");
    s = applyEvent(s, { type: "START_ROUND", round: { id: "r1", game: "cronometro", prompt: "", options: [], startedAt: 1, seed: 1 }, eventId: "e1", at: 1 });
    s = applyEvent(s, { type: "VOTE", roundId: "r1", participantId: "a", value: "8000", eventId: "e2", at: 2 });
    s = applyEvent(s, { type: "VOTE", roundId: "r1", participantId: "a", value: "7500", eventId: "e3", at: 3 });
    expect(s.live?.round?.votes.a.value).toBe("8000");
  });

  it("los puntos se acotan al guardar", () => {
    let s = emptyCarrete("ABCDEF");
    s = applyEvent(s, { type: "START_ROUND", round: { id: "r1", game: "cajas", prompt: "", options: [], startedAt: 1, seed: 1 }, eventId: "e1", at: 1 });
    s = applyEvent(s, { type: "REVEAL_ROUND", roundId: "r1", points: { a: 9999, b: -9999 }, eventId: "e2", at: 2 });
    expect(s.live?.history.at(-1)?.points).toEqual({ a: 100, b: -100 });
  });
});
