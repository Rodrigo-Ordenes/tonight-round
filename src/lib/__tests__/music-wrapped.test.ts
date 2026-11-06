import { describe, expect, it } from "vitest";
import { applyEvents } from "@/lib/carreteState";
import { songQueue } from "@/lib/music";
import { buildWrapped } from "@/lib/wrapped";
import { ev, person, room } from "./fixtures";

const req = (id: string, at: number) => ev({ type: "SONG_REQUEST", request: { id, by: "ana", text: id, at } });

describe("cola de pedidos", () => {
  it("se ordena por votos y luego por antigüedad", () => {
    const s = applyEvents(room(), [req("a", 1), req("b", 2), req("c", 3), ev({ type: "VOTE_SONG", id: "c", participantId: "x" }), ev({ type: "VOTE_SONG", id: "c", participantId: "y" }), ev({ type: "VOTE_SONG", id: "b", participantId: "x" })]);
    expect(songQueue(s.music).map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("votar dos veces la misma canción quita el voto", () => {
    const s = applyEvents(room(), [req("a", 1), ev({ type: "VOTE_SONG", id: "a", participantId: "x" }), ev({ type: "VOTE_SONG", id: "a", participantId: "x" })]);
    expect(s.music!.requests![0].votes ?? []).toHaveLength(0);
  });
});

describe("Wrapped ampliado", () => {
  it("incluye canción más votada, trago más registrado e hidratación del grupo", () => {
    const drink = (id: string, label: string) => ({ id, label, ml: 50, abv: 0.4, ts: 1 });
    let s = room();
    s = applyEvents(s, [
      ev({ type: "ADD_PARTICIPANT", participant: person("ana", { consumptions: [drink("1", "Piscola"), drink("2", "Piscola")], water: [{ id: "w1", ts: 1 }], waterCount: 1 }) }),
      ev({ type: "ADD_PARTICIPANT", participant: person("beto", { consumptions: [drink("3", "Gin Tonic")], water: [{ id: "w2", ts: 1 }], waterCount: 1 }) }),
      req("Bad Bunny", 1),
      ev({ type: "VOTE_SONG", id: "Bad Bunny", participantId: "beto" }),
    ]);
    const w = buildWrapped(s);
    expect(w.topDrink).toBe("Piscola");
    expect(w.topSong).toBe("Bad Bunny");
    expect(w.hydrationPct).toBe(67);
  });
});
