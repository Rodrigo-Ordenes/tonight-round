import { NextResponse } from "next/server";
import { CODE_RE, type CarreteEvent, type CarreteState } from "@/lib/carreteState";
import { getCarreteStore } from "@/lib/carreteStore";

export const dynamic = "force-dynamic";

// Las salas viven en Redis (Upstash / Vercel KV vía REST) si hay variables de entorno, o en la memoria del proceso
// si no (ver src/lib/carreteStore.ts). Aun así los clientes guardan el estado completo y lo re-siembran (`seed`)
// si la sala desaparece, y cada cierto tiempo envían un PUT de anti-entropía que el merge une sin perder nada.

type Ctx = { params: { code: string } };

type PostBody = { events: CarreteEvent[] } | { seed: CarreteState } | CarreteState;

const isEvents = (b: PostBody): b is { events: CarreteEvent[] } => Array.isArray((b as { events?: unknown }).events);
const isSeed = (b: PostBody): b is { seed: CarreteState } => typeof (b as { seed?: unknown }).seed === "object";

const unavailable = (e: unknown) => {
  console.error("[carrete] almacén no disponible", e);
  return NextResponse.json({ error: "store_unavailable" }, { status: 503 });
};

// GET: polling y sincronización
export async function GET(_req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  try {
    const s = await getCarreteStore().get(code);
    if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(s);
  } catch (e) {
    return unavailable(e);
  }
}

// POST: { events } aplica acciones delta idempotentes; { seed } o un estado completo crea/repara la sala.
export async function POST(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const store = getCarreteStore();
  try {
    if (isEvents(body)) {
      const next = await store.applyEvents(code, body.events.slice(0, 200));
      if (!next) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json(next);
    }

    if (isSeed(body)) return NextResponse.json(await store.upsert(code, body.seed));

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
  const code = params.code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  let body: CarreteState;
  try {
    body = (await req.json()) as CarreteState;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getCarreteStore().upsert(code, body));
  } catch (e) {
    return unavailable(e);
  }
}
