import { applyEvents, mergeCarrete, normalizeCarrete, type CarreteEvent, type CarreteState } from "./carreteState";

/**
 * Almacén de salas del lado del servidor.
 *
 * - Con `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL`/`KV_REST_API_TOKEN`, que es lo
 *   que inyecta la integración de Upstash en Vercel) usa Redis vía REST con `fetch`: sin dependencias y compartido
 *   entre todas las instancias serverless.
 * - Sin esas variables cae a la memoria del proceso (desarrollo local o un solo servidor).
 *
 * Modelo en Redis: una foto compactada (`s`, con un token de versión `v`) más un log append-only de entradas
 * (`{e: eventos}` o `{m: estado completo a mergear}`). Escribir es un RPUSH atómico, así que acciones simultáneas
 * desde distintas instancias nunca se pisan; el estado se obtiene plegando el log sobre la foto con las mismas
 * funciones puras del cliente. Cada cierto número de entradas alguien compacta con un CAS sobre `v` (script Lua).
 */
export interface CarreteStore {
  readonly kind: "redis" | "memory";
  get(code: string): Promise<CarreteState | null>;
  /** Aplica eventos idempotentes. `null` si la sala no existe. */
  applyEvents(code: string, events: CarreteEvent[]): Promise<CarreteState | null>;
  /** Crea o mergea un estado completo. Con `createOnly`, devuelve `null` si la sala ya existía. */
  upsert(code: string, incoming: CarreteState, opts?: { createOnly?: boolean }): Promise<CarreteState | null>;
}

export const ROOM_TTL_SECONDS = 48 * 60 * 60;

/* ------------------------------------------------------------------ */
/* Memoria (fallback)                                                  */
/* ------------------------------------------------------------------ */

function memoryStore(): CarreteStore {
  const g = globalThis as unknown as { __carretes?: Map<string, { state: CarreteState; expiresAt: number }> };
  const db = (g.__carretes ??= new Map());
  const read = (code: string) => {
    const row = db.get(code);
    if (!row) return null;
    if (row.expiresAt < Date.now()) {
      db.delete(code);
      return null;
    }
    return row.state;
  };
  const write = (code: string, state: CarreteState) => {
    db.set(code, { state, expiresAt: Date.now() + ROOM_TTL_SECONDS * 1000 });
    return state;
  };
  // Todo es síncrono dentro de un mismo proceso, así que cada operación ya es atómica.
  return {
    kind: "memory",
    get: async (code) => read(code),
    applyEvents: async (code, events) => {
      const cur = read(code);
      return cur ? write(code, applyEvents(cur, events)) : null;
    },
    upsert: async (code, incoming, opts) => {
      const cur = read(code);
      if (cur && opts?.createOnly) return null;
      const s = { ...incoming, code };
      return write(code, cur ? mergeCarrete(cur, s) : normalizeCarrete(s));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Redis vía REST (Upstash / Vercel KV)                                */
/* ------------------------------------------------------------------ */

type LogEntry = { e: CarreteEvent[] } | { m: CarreteState };
/** Respuesta de los scripts de lectura: [foto, versión, log] o null si la sala no existe. */
type RawRoom = [string, string, string[]] | null;

// KEYS[1] = hash { s, v }, KEYS[2] = log. Ambas llaves comparten el hash tag {CODE} (mismo slot en clúster).
const READ_TAIL = `
local s = redis.call('HMGET', KEYS[1], 's', 'v')
if not s[1] then return false end
return {s[1], s[2], redis.call('LRANGE', KEYS[2], 0, -1)}`;

// ARGV[1] = entrada del log, ARGV[2] = TTL
const LUA_APPEND = `
if redis.call('EXISTS', KEYS[1]) == 0 then return false end
redis.call('RPUSH', KEYS[2], ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
redis.call('EXPIRE', KEYS[2], ARGV[2])
${READ_TAIL}`;

// ARGV[1] = estado completo, ARGV[2] = TTL, ARGV[3] = '1' si solo crear, ARGV[4] = versión nueva.
// Si la sala existe, el estado entra al log como merge; si no, es la foto inicial.
const LUA_UPSERT = `
if redis.call('EXISTS', KEYS[1]) == 1 then
  if ARGV[3] == '1' then return 0 end
  redis.call('RPUSH', KEYS[2], '{"m":' .. ARGV[1] .. '}')
else
  redis.call('DEL', KEYS[2])
  redis.call('HSET', KEYS[1], 's', ARGV[1], 'v', ARGV[4])
end
redis.call('EXPIRE', KEYS[1], ARGV[2])
if redis.call('EXISTS', KEYS[2]) == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end
${READ_TAIL}`;

const LUA_READ = READ_TAIL;

// Compactación con CAS: solo si nadie compactó desde que leímos. El log solo crece por la cola y solo se recorta
// aquí, así que quitar las primeras N entradas elimina exactamente las que se plegaron en la foto nueva.
// ARGV[1] = versión esperada, ARGV[2] = foto nueva, ARGV[3] = N plegadas, ARGV[4] = versión nueva
const LUA_COMPACT = `
if redis.call('HGET', KEYS[1], 'v') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 's', ARGV[2], 'v', ARGV[4])
redis.call('LTRIM', KEYS[2], tonumber(ARGV[3]), -1)
return 1`;

/** Se compacta cuando el log acumula esta cantidad de entradas. */
const COMPACT_AFTER = 24;
/** Micro-caché por instancia para los GET de polling (varios celulares en la misma instancia caliente). */
const READ_CACHE_MS = 1000;

const newVersion = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function redisStore(url: string, token: string, prefix: string): CarreteStore {
  const keys = (code: string) => [`${prefix}{${code}}:s`, `${prefix}{${code}}:log`];
  const cache = new Map<string, { state: CarreteState; at: number }>();

  async function cmd<T>(args: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args.map(String)),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
    if (!res.ok || json.error) throw new Error(`redis: ${json.error ?? res.status}`);
    return json.result as T;
  }

  const evalScript = <T>(script: string, code: string, argv: (string | number)[]) =>
    cmd<T>(["EVAL", script, 2, ...keys(code), ...argv]);

  /** Pliega el log sobre la foto y, si creció demasiado, intenta compactar (perder la carrera es inofensivo). */
  async function materialize(code: string, raw: RawRoom): Promise<CarreteState | null> {
    if (!raw) {
      cache.delete(code);
      return null;
    }
    const [snap, version, log] = raw;
    let state = normalizeCarrete(JSON.parse(snap) as CarreteState);
    for (const line of log) {
      const entry = JSON.parse(line) as LogEntry;
      state = "e" in entry ? applyEvents(state, entry.e) : mergeCarrete(state, { ...entry.m, code });
    }
    if (log.length >= COMPACT_AFTER) {
      await evalScript<number>(LUA_COMPACT, code, [version, JSON.stringify(state), log.length, newVersion()]).catch(
        () => 0
      );
    }
    cache.set(code, { state, at: Date.now() });
    return state;
  }

  return {
    kind: "redis",
    async get(code) {
      const hit = cache.get(code);
      if (hit && Date.now() - hit.at < READ_CACHE_MS) return hit.state;
      return materialize(code, await evalScript<RawRoom>(LUA_READ, code, []));
    },
    async applyEvents(code, events) {
      const entry: LogEntry = { e: events };
      return materialize(code, await evalScript<RawRoom>(LUA_APPEND, code, [JSON.stringify(entry), ROOM_TTL_SECONDS]));
    },
    async upsert(code, incoming, opts) {
      const s = normalizeCarrete({ ...incoming, code });
      const raw = await evalScript<RawRoom | 0>(LUA_UPSERT, code, [
        JSON.stringify(s),
        ROOM_TTL_SECONDS,
        opts?.createOnly ? "1" : "0",
        newVersion(),
      ]);
      return raw === 0 ? null : materialize(code, raw);
    },
  };
}

/* ------------------------------------------------------------------ */

let store: CarreteStore | undefined;

export function getCarreteStore(): CarreteStore {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  store =
    url && token
      ? redisStore(url.replace(/\/+$/, ""), token, process.env.CARRETE_KEY_PREFIX ?? "tonight:carrete:")
      : memoryStore();
  return store;
}
