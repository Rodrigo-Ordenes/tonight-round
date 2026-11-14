import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RoomTooLargeError, createFileStore } from "@/lib/carreteFileStore";
import { emptyCarrete, normalizeCarrete, type CarreteState } from "@/lib/carreteState";
import { zeroCopy } from "@/lib/zeroCopy";
import { codeFromPath } from "@/lib/useActiveCode";
import { keepaliveBody } from "@/store/keepalive";
import { clientKey, createLimiter } from "@/lib/rateLimit";
import { ev, person, room } from "./fixtures";

describe("mensaje de volver a 0.00", () => {
  it("quien tomó y ya llegó a cero ve una estimación con advertencia", () => {
    const c = zeroCopy({ hadDrinks: true, zeroAt: null });
    expect(c.headline).toBe("Estimación: 0.00");
    expect(c.caveat).toMatch(/no sirve para decidir si manejar/);
  });
  it("quien no ha registrado nada no recibe advertencia", () => {
    expect(zeroCopy({ hadDrinks: false, zeroAt: null })).toEqual({ headline: "Sin alcohol registrado", caveat: null });
  });
  it("con alcohol en curso siempre lleva advertencia", () => {
    expect(zeroCopy({ hadDrinks: true, zeroAt: 123 }).caveat).toMatch(/no sirve para decidir si manejar/);
  });
});

describe("código en la URL", () => {
  it.each([["/carrete/ABCDEF", "ABCDEF"], ["/carrete/abcd", "ABCD"]])("%s", (p, c) => expect(codeFromPath(p)).toBe(c));
  it("otras rutas no tienen código", () => expect(codeFromPath("/bar")).toBeNull());
});

describe("envío al salir de la página", () => {
  it("manda los eventos pendientes", () => {
    expect(JSON.parse(keepaliveBody([ev({ type: "UNDO_DRINK", participantId: "a" } as never)])!).events).toHaveLength(1);
  });
  it("no manda nada sin pendientes", () => expect(keepaliveBody([])).toBeNull());
  it("respeta el tope de keepalive quedándose con los primeros que caben", () => {
    const many = Array.from({ length: 2000 }, (_, i) => ev({ type: "SONG_PLAYED", id: `x${i}`.repeat(10) } as never));
    const body = keepaliveBody(many)!;
    expect(new Blob([body]).size).toBeLessThanOrEqual(60_000);
    expect(JSON.parse(body).events.length).toBeGreaterThan(0);
  });
});

describe("clave cuando el servidor no informa al cliente", () => {
  it("una dirección local cuenta como balde común", () => {
    for (const ip of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) expect(clientKey(new Headers({ "x-forwarded-for": ip }))).toBe("shared");
  });
  it("el balde común tolera un sitio entero creando salas", async () => {
    const l = createLimiter(null);
    let last = { ok: true, retryAfter: 0 };
    for (let i = 0; i < 200; i++) last = await l.hit("create", "shared", 3_600_000_000);
    expect(last.ok).toBe(true);
  });
});

describe("tope de lo que crece dentro de una sala", () => {
  let dir: string;
  beforeEach(() => void (dir = mkdtempSync(join(tmpdir(), "tonight-cap-"))));
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const c = (i: number) => ({ id: `c${i}`, label: "x".repeat(500), ml: 1, abv: 0.1, ts: i });

  it("acota listas y etiquetas de cada persona", () => {
    const s = normalizeCarrete({
      ...room(),
      participants: [person("a", { consumptions: Array.from({ length: 900 }, (_, i) => c(i)), removedIds: Array.from({ length: 9000 }, (_, i) => `r${i}`) })],
    });
    expect(s.participants[0].consumptions).toHaveLength(200);
    expect(s.participants[0].consumptions[199].ts).toBe(899);
    expect(s.participants[0].consumptions[0].label.length).toBe(60);
    expect(s.participants[0].removedIds!.length).toBe(500);
  });

  it("descarta claves desconocidas del estado", () => {
    const s = normalizeCarrete({ ...room(), basura: "x".repeat(1000) } as unknown as CarreteState);
    expect(s).not.toHaveProperty("basura");
  });

  it("no deja crecer una sala más allá del tope aunque ya exista", async () => {
    const s = createFileStore(dir, { maxRoomBytes: 3000 });
    await s.upsert("ABCD", emptyCarrete("ABCD"));
    const big = { ...emptyCarrete("ABCD"), updatedAt: 9, participants: Array.from({ length: 50 }, (_, i) => person(`p${i}`, { commune: "y" })) };
    await expect(s.upsert("ABCD", big)).rejects.toBeInstanceOf(RoomTooLargeError);
    expect(statSync(join(dir, "ABCD.json")).size).toBeLessThan(3000);
    expect(JSON.parse(readFileSync(join(dir, "ABCD.json"), "utf8")).participants).toHaveLength(0);
  });
});
