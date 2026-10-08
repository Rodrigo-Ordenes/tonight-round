import { NextResponse } from "next/server";
import { CODE_RE, mergeCarrete, type CarreteState } from "@/lib/carreteState";

export const dynamic = "force-dynamic";

// Backend efímero en memoria (un solo servidor). En serverless se necesitaría Redis/KV.
const g = globalThis as unknown as { __carretes?: Map<string, CarreteState> };
const db = (g.__carretes ??= new Map<string, CarreteState>());

type Ctx = { params: { code: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  const s = db.get(code);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(s);
}

// Crear: 409 si ya existe
export async function POST(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "bad_code" }, { status: 400 });
  if (db.has(code)) return NextResponse.json({ error: "exists" }, { status: 409 });
  const body = (await req.json()) as CarreteState;
  db.set(code, { ...body, code });
  return NextResponse.json(db.get(code));
}

// Sincronizar: merge LWW y devolver estado fusionado (si no existe, 404)
export async function PUT(req: Request, { params }: Ctx) {
  const code = params.code.toUpperCase();
  const cur = db.get(code);
  if (!cur) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await req.json()) as CarreteState;
  const merged = mergeCarrete(cur, { ...body, code });
  db.set(code, merged);
  return NextResponse.json(merged);
}
