import { NextResponse } from "next/server";
import {
  CODE_RE,
  applyEvents,
  mergeCarrete,
  normalizeCarrete,
  type CarreteEvent,
  type CarreteState,
} from "@/lib/carreteState";

export const dynamic = "force-dynamic";

// Backend efímero en memoria (un solo servidor). En serverless cada instancia tiene su propia memoria:
// los clientes guardan el estado completo y lo re-siembran (`seed`) si la sala desaparece, y cada cierto
// tiempo envían un PUT de anti-entropía que el merge une sin perder tragos ni votos.
const g = globalThis as unknown as { __carretes?: Map<string, CarreteState> };
const db = (g.__carretes ??= new Map<string, CarreteState>());

type Ctx = { params: { code: string } };

type PostBody = { events: CarreteEvent[] } | { seed: CarreteState } | CarreteState;

const isEvents = (b: PostBody): b is { events: CarreteEvent[] } => Array.isArray((b as { events?: unknown }).events);
const isSeed = (b: PostBody): b is { seed: CarreteState } => typeof (b as { seed?: unknown }).seed === "object";

function upsert(code: string, incoming: CarreteState): CarreteState {
  const cur = db.get(code);
  const next = cur ? mergeCarrete(cur, { ...incoming, code }) : normalizeCarrete({ ...incoming, code });
  db.set(code, next);
  return next;
}

// GET: polling y sincronización
export async function GET(_req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  const s = db.get(code);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(s);
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

  if (isEvents(body)) {
    const cur = db.get(code);
    if (!cur) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const next = applyEvents(cur, body.events.slice(0, 200));
    db.set(code, next);
    return NextResponse.json(next);
  }

  if (isSeed(body)) return NextResponse.json(upsert(code, body.seed));

  // Estado completo sin envoltura = crear sala nueva: si el código ya existe, el cliente genera otro.
  if (db.has(code)) return NextResponse.json({ error: "exists" }, { status: 409 });
  return NextResponse.json(upsert(code, body), { status: 201 });
}

// PUT: anti-entropía con el estado completo (merge sin pérdida)
export async function PUT(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  const body = (await req.json()) as CarreteState;
  return NextResponse.json(upsert(code, body));
}
