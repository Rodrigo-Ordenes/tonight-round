import { createHash } from "node:crypto";
import { appendFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

type Bucket = "create" | "miss" | "write";

const RULES: Record<Bucket, { max: number; windowMs: number }> = {
  create: { max: 20, windowMs: 60 * 60 * 1000 },
  miss: { max: 60, windowMs: 60 * 1000 },
  write: { max: 1200, windowMs: 60 * 1000 },
};
const SWEEP_EVERY_MS = 10 * 60 * 1000;
const KEEP_MS = 2 * 60 * 60 * 1000;

/**
 * Clave del cliente: la entrada derecha de X-Forwarded-For es la que agrega el servidor; las anteriores las puede
 * escribir cualquiera. Se guarda solo un hash. Sin la cabecera, todos comparten un balde.
 */
export function clientKey(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 24) : "shared";
}

export interface Limiter {
  hit(bucket: Bucket, key: string, now?: number): Promise<{ ok: boolean; retryAfter: number }>;
}

/** Ventana fija. En disco, cada intento agrega un byte: la escritura en modo append es atómica entre procesos. */
export function createLimiter(dir: string | null): Limiter {
  const memory = new Map<string, number>();
  const root = dir ? join(dir, ".rate") : null;
  let lastSweep = 0;

  async function count(name: string): Promise<number> {
    if (!root) {
      const n = (memory.get(name) ?? 0) + 1;
      memory.set(name, n);
      return n;
    }
    const path = join(root, name);
    await mkdir(root, { recursive: true });
    await appendFile(path, "x");
    return (await stat(path)).size;
  }

  async function sweep(now: number) {
    if (now - lastSweep < SWEEP_EVERY_MS) return;
    lastSweep = now;
    if (!root) {
      if (memory.size > 5000) memory.clear();
      return;
    }
    for (const name of await readdir(root).catch(() => [] as string[])) {
      const path = join(root, name);
      const info = await stat(path).catch(() => null);
      if (info && Date.now() - info.mtimeMs > KEEP_MS) await unlink(path).catch(() => undefined);
    }
  }

  return {
    async hit(bucket, key, now = Date.now()) {
      const { max, windowMs } = RULES[bucket];
      const window = Math.floor(now / windowMs);
      void sweep(now);
      const used = await count(`${bucket}-${key}-${window}`);
      return { ok: used <= max, retryAfter: Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000)) };
    },
  };
}

let shared: Limiter | undefined;

export function getLimiter(): Limiter {
  return (shared ??= createLimiter(process.env.CARRETE_DATA_DIR ?? null));
}
