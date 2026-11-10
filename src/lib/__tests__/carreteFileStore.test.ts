import { mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreFullError, createFileStore } from "@/lib/carreteFileStore";
import { emptyCarrete } from "@/lib/carreteState";
import { ev, person } from "./fixtures";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tonight-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const add = (id: string) => ev({ type: "ADD_PARTICIPANT", participant: person(id) });

describe("almacén de salas en disco", () => {
  it("la sala sobrevive a un reinicio del proceso", async () => {
    await createFileStore(dir).upsert("ABCD", emptyCarrete("ABCD"));
    expect((await createFileStore(dir).get("ABCD"))?.code).toBe("ABCD");
  });

  it("acciones simultáneas desde dos procesos no se pisan", async () => {
    const a = createFileStore(dir);
    const b = createFileStore(dir);
    await a.upsert("ABCD", emptyCarrete("ABCD"));
    await Promise.all(Array.from({ length: 40 }, (_, i) => (i % 2 ? a : b).applyEvents("ABCD", [add(`p${i}`)])));
    expect((await a.get("ABCD"))!.participants).toHaveLength(40);
  });

  it("createOnly no pisa una sala existente; sala inexistente no acepta eventos", async () => {
    const s = createFileStore(dir);
    expect(await s.applyEvents("NOPE", [add("x")])).toBeNull();
    await s.upsert("ABCD", emptyCarrete("ABCD"));
    expect(await s.upsert("ABCD", emptyCarrete("ABCD"), { createOnly: true })).toBeNull();
  });

  it("un código con ruta no sale del directorio", async () => {
    const s = createFileStore(dir);
    expect(await s.get("../../etc/passwd")).toBeNull();
    await expect(s.upsert("../X", emptyCarrete("ABCD"))).rejects.toThrow();
    expect(readdirSync(dir)).toHaveLength(0);
  });

  it("una sala vencida (48 h sin escribir) desaparece", async () => {
    const s = createFileStore(dir);
    await s.upsert("ABCD", emptyCarrete("ABCD"));
    const old = new Date(Date.now() - 49 * 3600_000);
    utimesSync(join(dir, "ABCD.json"), old, old);
    expect(await s.get("ABCD")).toBeNull();
  });

  it("un candado huérfano de un proceso caído no bloquea la sala", async () => {
    const s = createFileStore(dir);
    await s.upsert("ABCD", emptyCarrete("ABCD"));
    writeFileSync(join(dir, "ABCD.lock"), "");
    const old = new Date(Date.now() - 60_000);
    utimesSync(join(dir, "ABCD.lock"), old, old);
    expect(await s.applyEvents("ABCD", [add("x")])).not.toBeNull();
  });
});

describe("capacidad del disco", () => {
  it("rechaza una sala nueva con el máximo de salas, pero actualiza las existentes", async () => {
    const s = createFileStore(dir, { maxRooms: 2 });
    await s.upsert("AAAA", emptyCarrete("AAAA"));
    await s.upsert("BBBB", emptyCarrete("BBBB"));
    await expect(createFileStore(dir, { maxRooms: 2 }).upsert("CCCC", emptyCarrete("CCCC"))).rejects.toBeInstanceOf(StoreFullError);
    await expect(s.upsert("AAAA", emptyCarrete("AAAA"))).resolves.not.toBeNull();
  });

  it("rechaza una sala nueva si se supera el tamaño total", async () => {
    const s = createFileStore(dir, { maxBytes: 10 });
    await s.upsert("AAAA", emptyCarrete("AAAA")).catch(() => null);
    writeFileSync(join(dir, "BBBB.json"), "x".repeat(20));
    await expect(createFileStore(dir, { maxBytes: 10 }).upsert("CCCC", emptyCarrete("CCCC"))).rejects.toBeInstanceOf(StoreFullError);
  });
});
