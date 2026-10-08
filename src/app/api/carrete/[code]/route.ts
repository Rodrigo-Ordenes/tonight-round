import { NextResponse } from "next/server";
import { CODE_RE, mergeCarrete, type CarreteState } from "@/lib/carreteState";

export const dynamic = "force-dynamic";

// Backend efímero en memoria (un solo servidor). En producción serverless se usaría Upstash Redis / Vercel KV.
const g = globalThis as unknown as { __carretes?: Map<string, CarreteState> };
const db = (g.__carretes ??= new Map<string, CarreteState>());

type Ctx = { params: { code: string } };

// GET: polling y sincronización
export async function GET(_req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  const s = db.get(code);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(s);
}

// POST: Crear o mutar estado efímero
export async function POST(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  const body = (await req.json()) as CarreteState;

  const cur = db.get(code);
  if (!cur) {
    db.set(code, { ...body, code });
    return NextResponse.json(db.get(code), { status: 201 });
  }

  // Mutación / Merge LWW
  const merged = mergeCarrete(cur, { ...body, code });
  db.set(code, merged);
  return NextResponse.json(merged, { status: 200 });
}

// PUT: Sincronización explícita con merge LWW
export async function PUT(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  const cur = db.get(code);
  const body = (await req.json()) as CarreteState;

  if (!cur) {
    db.set(code, { ...body, code });
    return NextResponse.json(db.get(code), { status: 200 });
  }

  const merged = mergeCarrete(cur, { ...body, code });
  db.set(code, merged);
  return NextResponse.json(merged, { status: 200 });
}
