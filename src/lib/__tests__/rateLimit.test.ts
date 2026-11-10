import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clientKey, createLimiter } from "@/lib/rateLimit";
import { emptyCarrete } from "@/lib/carreteState";

const NOW = 3_600_000_000;
let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "tonight-rate-"));
  process.env.CARRETE_DATA_DIR = dir;
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("clave por IP", () => {
  const h = (v?: string) => new Headers(v ? { "x-forwarded-for": v } : {});
  it("usa la entrada derecha, la que puso el servidor", () => {
    expect(clientKey(h("1.1.1.1, 2.2.2.2"))).toBe(clientKey(h("9.9.9.9, 2.2.2.2")));
    expect(clientKey(h("1.1.1.1, 2.2.2.2"))).not.toBe(clientKey(h("2.2.2.2, 1.1.1.1")));
  });
  it("no guarda la IP en claro", () => expect(clientKey(h("2.2.2.2"))).not.toContain("2.2.2.2"));
  it("sin cabecera usa un balde común", () => expect(clientKey(h())).toBe("shared"));
});

describe("limitador", () => {
  const run = async (l: ReturnType<typeof createLimiter>, n: number, key: string, now = NOW) => {
    let last = { ok: true, retryAfter: 0 };
    for (let i = 0; i < n; i++) last = await l.hit("create", key, now);
    return last;
  };

  it("el intento 21 de crear salas se rechaza con espera", async () => {
    const l = createLimiter(mkdtempSync(join(dir, "a")));
    expect((await run(l, 20, "k")).ok).toBe(true);
    const r = await l.hit("create", "k", NOW);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("la ventana siguiente vuelve a permitir", async () => {
    const l = createLimiter(mkdtempSync(join(dir, "b")));
    await run(l, 21, "k");
    expect((await l.hit("create", "k", NOW + 3_600_000)).ok).toBe(true);
  });

  it("dos procesos comparten el conteo", async () => {
    const d = mkdtempSync(join(dir, "c"));
    await run(createLimiter(d), 20, "k");
    expect((await createLimiter(d).hit("create", "k", NOW)).ok).toBe(false);
  });

  it("sin directorio cuenta en memoria", async () => {
    const l = createLimiter(null);
    await run(l, 20, "k");
    expect((await l.hit("create", "k", NOW)).ok).toBe(false);
  });
});

describe("la API de salas", () => {
  const ctx = (code: string) => ({ params: { code } }) as never;
  const req = (ip: string, init?: RequestInit) =>
    new Request("http://x/api", { ...init, headers: { "x-forwarded-for": ip } });

  it("no limita leer una sala existente aunque toda la mesa comparta IP", async () => {
    const { POST, GET } = await import("@/app/api/carrete/[code]/route");
    await POST(req("3.3.3.3", { method: "POST", body: JSON.stringify(emptyCarrete("AAAA")) }), ctx("AAAA"));
    const statuses = await Promise.all(Array.from({ length: 300 }, () => GET(req("3.3.3.3"), ctx("AAAA")).then((r) => r.status)));
    expect(new Set(statuses)).toEqual(new Set([200]));
  });

  it("frena a quien prueba códigos al azar, con 429 y mensaje", async () => {
    const { GET } = await import("@/app/api/carrete/[code]/route");
    let last = await GET(req("4.4.4.4"), ctx("ZZZZ"));
    for (let i = 0; i < 65; i++) last = await GET(req("4.4.4.4"), ctx("ZZZZ"));
    expect(last.status).toBe(429);
    expect(last.headers.get("retry-after")).toBeTruthy();
    expect((await last.json()).error).toBe("rate_limited");
  });

  it("un PUT a una sala inexistente cuenta como crear sala", async () => {
    const { PUT } = await import("@/app/api/carrete/[code]/route");
    let last = await PUT(req("5.5.5.5", { method: "PUT", body: JSON.stringify(emptyCarrete("Q000")) }), ctx("Q000"));
    for (let i = 1; i <= 21; i++) {
      const code = `Q${String(i).padStart(3, "0")}`;
      last = await PUT(req("5.5.5.5", { method: "PUT", body: JSON.stringify(emptyCarrete(code)) }), ctx(code));
    }
    expect(last.status).toBe(429);
  });
});
