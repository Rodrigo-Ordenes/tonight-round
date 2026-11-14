import { describe, expect, it } from "vitest";
import { roomEvents } from "@/lib/roomEvents";
import type { CarreteState } from "@/lib/carreteState";

const person = (id: string, extra: Record<string, unknown> = {}) =>
  ({
    id,
    name: id,
    bodyFactor: 0.6,
    role: "drinker",
    consumptions: [],
    waterCount: 0,
    water: [],
    status: "party",
    commune: "",
    arrivedAt: null,
    resurrectionLabel: "",
    resurrectionHour: null,
    resurrectionMode: "functional",
    active: true,
    joinedAt: 0,
    updatedAt: 0,
    ...extra,
  }) as CarreteState["participants"][number];

const state = {
  code: "ABCDEF",
  createdAt: 0,
  updatedAt: 0,
  participants: [
    person("ana", {
      consumptions: [
        { id: "c1", label: "Piscola", ml: 200, abv: 0.105, ts: 50 },
        { id: "c2", label: "Piscola", ml: 200, abv: 0.105, ts: 300 },
      ],
      water: [{ id: "w1", ts: 250 }],
    }),
    person("beto", { consumptions: [{ id: "c3", label: "Cerveza", ml: 350, abv: 0.05, ts: 400 }] }),
    person("borrado", { deleted: true, consumptions: [{ id: "c4", label: "Vino", ml: 150, abv: 0.13, ts: 500 }] }),
  ],
  live: {
    round: { id: "r1", game: "yonunca", prompt: "", options: [], startedAt: 100, votes: { ana: { value: "si", at: 320 }, beto: { value: "no", at: 90 } } },
    history: [],
    confessions: [],
    cheers: { id: "ch1", by: "beto", at: 450 },
    updatedAt: 0,
  },
  music: { vibeId: "x", auto: true, requests: [{ id: "s1", by: "ana", text: "Tusa", at: 280 }], updatedAt: 0 },
} as unknown as CarreteState;

describe("eventos de la sala para la TV", () => {
  it("junta tragos, agua, votos, pedidos y brindis posteriores al corte, en orden", () => {
    const ev = roomEvents(state, 200);
    expect(ev.map((e) => [e.kind, e.participantId, e.at])).toEqual([
      ["water", "ana", 250],
      ["song", "ana", 280],
      ["drink", "ana", 300],
      ["vote", "ana", 320],
      ["drink", "beto", 400],
      ["cheers", "beto", 450],
    ]);
  });

  it("las claves son estables entre llamadas (cada evento viaja una sola vez)", () => {
    expect(roomEvents(state, 0).map((e) => e.key)).toEqual(roomEvents(state, 0).map((e) => e.key));
    expect(new Set(roomEvents(state, 0).map((e) => e.key)).size).toBe(roomEvents(state, 0).length);
  });

  it("excluye lo anterior al corte y a quien se fue de la sala", () => {
    const ev = roomEvents(state, 0);
    expect(ev.some((e) => e.at <= 0)).toBe(false);
    expect(ev.some((e) => e.participantId === "borrado")).toBe(false);
    expect(roomEvents(state, 1000)).toEqual([]);
  });

  it("una sala vacía o sin datos en vivo no rompe", () => {
    expect(roomEvents({ ...state, participants: [], live: undefined, music: undefined }, 0)).toEqual([]);
  });
});
