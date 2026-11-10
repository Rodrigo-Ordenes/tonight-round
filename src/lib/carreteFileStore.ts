import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CODE_RE, ROOM_TTL_SECONDS, applyEvents, mergeCarrete, normalizeCarrete, type CarreteState } from "./carreteState";
import type { CarreteStore } from "./carreteStore";

const TTL_MS = ROOM_TTL_SECONDS * 1000;
const STALE_LOCK_MS = 10_000;
const LOCK_RETRY_MS = 8;
const LOCK_TIMEOUT_MS = 8_000;
const SWEEP_EVERY_MS = 60 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isCode = (code: string) => CODE_RE.test(code);

/**
 * Salas en archivos JSON, para un servidor único con varios procesos posibles (LiteSpeed en cPanel): sobreviven
 * cuando la app se apaga por inactividad y todos los procesos ven lo mismo. Cada sala tiene un candado por archivo
 * (creación exclusiva) y se escribe de forma atómica (temporal + rename). El vencimiento usa la fecha del archivo.
 */
export function createFileStore(dir: string): CarreteStore {
  let lastSweep = 0;
  const file = (code: string) => join(dir, `${code}.json`);

  async function withLock<T>(code: string, fn: () => Promise<T>): Promise<T> {
    const lock = join(dir, `${code}.lock`);
    await mkdir(dir, { recursive: true });
    const deadline = Date.now() + LOCK_TIMEOUT_MS;
    for (;;) {
      try {
        await (await open(lock, "wx")).close();
        break;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
        const info = await stat(lock).catch(() => null);
        if (info && Date.now() - info.mtimeMs > STALE_LOCK_MS) await unlink(lock).catch(() => undefined);
        if (Date.now() > deadline) throw new Error(`candado ocupado: ${code}`);
        await sleep(LOCK_RETRY_MS + Math.random() * LOCK_RETRY_MS);
      }
    }
    try {
      return await fn();
    } finally {
      await unlink(lock).catch(() => undefined);
    }
  }

  async function read(code: string): Promise<CarreteState | null> {
    try {
      const info = await stat(file(code));
      if (Date.now() - info.mtimeMs > TTL_MS) return null;
      return normalizeCarrete(JSON.parse(await readFile(file(code), "utf8")) as CarreteState);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async function write(code: string, state: CarreteState) {
    const tmp = join(dir, `${code}.${randomUUID()}.tmp`);
    await writeFile(tmp, JSON.stringify(state));
    await rename(tmp, file(code));
    void sweep();
    return state;
  }

  /** Borra salas vencidas y temporales huérfanos, como mucho una vez por hora. */
  async function sweep() {
    if (Date.now() - lastSweep < SWEEP_EVERY_MS) return;
    lastSweep = Date.now();
    for (const name of await readdir(dir).catch(() => [] as string[])) {
      const path = join(dir, name);
      const info = await stat(path).catch(() => null);
      if (info && Date.now() - info.mtimeMs > TTL_MS) await unlink(path).catch(() => undefined);
    }
  }

  return {
    kind: "file",
    get: async (code) => (isCode(code) ? read(code) : null),
    applyEvents: async (code, events) => {
      if (!isCode(code)) return null;
      return withLock(code, async () => {
        const cur = await read(code);
        return cur ? write(code, applyEvents(cur, events)) : null;
      });
    },
    upsert: async (code, incoming, opts) => {
      if (!isCode(code)) throw new Error("código inválido");
      return withLock(code, async () => {
        const cur = await read(code);
        if (cur && opts?.createOnly) return null;
        const s = { ...incoming, code };
        return write(code, cur ? mergeCarrete(cur, s, "a") : normalizeCarrete(s));
      });
    },
  };
}
