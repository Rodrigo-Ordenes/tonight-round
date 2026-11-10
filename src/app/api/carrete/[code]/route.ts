import { NextResponse } from "next/server";
import { CODE_RE, type CarreteEvent, type CarreteState } from "@/lib/carreteState";
import { StoreFullError } from "@/lib/carreteFileStore";
import { getCarreteStore } from "@/lib/carreteStore";
import { clientKey, getLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Las salas viven en Redis (Upstash / Vercel KV vía REST) si hay variables de entorno, o en la memoria del proceso
// si no (ver src/lib/carreteStore.ts). Aun así los clientes guardan el estado completo y lo re-siembran (`seed`)
// si la sala desaparece, y cada cierto tiempo envían un PUT de anti-entropía que el merge une sin perder nada.

type Ctx = { params: Promise<{ code: string }> };

type PostBody = { events: CarreteEvent[] } | { seed: CarreteState } | CarreteState;

const isEvents = (b: PostBody): b is { events: CarreteEvent[] } => Array.isArray((b as { events?: unknown }).events);
const isSeed = (b: PostBody): b is { seed: CarreteState } => typeof (b as { seed?: unknown }).seed === "object";

/** Tope por petición: una sala real pesa decenas de KB; evita llenar el disco de un hosting compartido. */
const MAX_BODY_CHARS = 1_000_000;
const tooLarge = () => NextResponse.json({ error: "too_large" }, { status: 413 });

async function readBody<T>(req: Request): Promise<T | "bad" | "large"> {
  const text = await req.text().catch(() => "");
  if (text.length > MAX_BODY_CHARS) return "large";
  try {
    return JSON.parse(text) as T;
  } catch {
    return "bad";
  }
}

/** Devuelve la respuesta 429 si se pasó del límite; null si puede seguir. */
async function limited(bucket: "create" | "miss" | "write", req: Request) {
  const r = await getLimiter().hit(bucket, clientKey(req.headers));
  if (r.ok) return null;
  return NextResponse.json(
    { error: "rate_limited", message: "Muchas acciones seguidas. Espera un momento e intenta de nuevo." },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } }
  );
}

const unavailable = (e: unknown) => {
  if (e instanceof StoreFullError)
    return NextResponse.json({ error: "full", message: "Hay demasiadas salas activas. Intenta en un rato." }, { status: 503 });
  console.error("[carrete] almacén no disponible", e);
  return NextResponse.json({ error: "store_unavailable" }, { status: 503 });
};

// GET: polling y sincronización
export async function GET(req: Request, { params }: Ctx) {
  const code = (await params).code.toUpperCase();
  try {
    const s = await getCarreteStore().get(code);
    if (!s) return (await limited("miss", req)) ?? NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(s);
  } catch (e) {
    return unavailable(e);
  }
}

// POST: { events } aplica acciones delta idempotentes; { seed } o un estado completo crea/repara la sala.
export async function POST(req: Request, { params }: Ctx) {
  const code = (await params).code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  const body = await readBody<PostBody>(req);
  if (body === "large") return tooLarge();
  if (body === "bad") return NextResponse.json({ error: "bad_json" }, { status: 400 });

  const store = getCarreteStore();
  try {
    if (isEvents(body)) {
      const blocked = await limited("write", req);
      if (blocked) return blocked;
      const next = await store.applyEvents(code, body.events.slice(0, 200));
      if (!next) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json(next);
    }

    if (isSeed(body)) {
      const blocked = await limited((await store.get(code)) ? "write" : "create", req);
      if (blocked) return blocked;
      return NextResponse.json(await store.upsert(code, body.seed));
    }

    const blocked = await limited("create", req);
    if (blocked) return blocked;

    // Estado completo sin envoltura = crear sala nueva: si el código ya existe, el cliente genera otro.
    const created = await store.upsert(code, body, { createOnly: true });
    if (!created) return NextResponse.json({ error: "exists" }, { status: 409 });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return unavailable(e);
  }
}

// PUT: anti-entropía con el estado completo (merge sin pérdida)
export async function PUT(req: Request, { params }: Ctx) {
  const code = (await params).code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  const body = await readBody<CarreteState>(req);
  if (body === "large") return tooLarge();
  if (body === "bad") return NextResponse.json({ error: "bad_json" }, { status: 400 });
  try {
    const store = getCarreteStore();
    const blocked = await limited((await store.get(code)) ? "write" : "create", req);
    if (blocked) return blocked;
    return NextResponse.json(await store.upsert(code, body));
  } catch (e) {
    return unavailable(e);
  }
}
