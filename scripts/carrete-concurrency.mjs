// Prueba de concurrencia del bus de salas: 40 POST {events} simultáneos + PUT/seed en paralelo.
// Uso: node scripts/carrete-concurrency.mjs <baseUrl1> [baseUrl2 ...]  — reparte las peticiones entre instancias.
const bases = process.argv.slice(2);
const N = 40;
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
const url = (i = 0) => `${bases[i % bases.length]}/api/carrete/${code}`;
const now = Date.now();
const empty = { code, createdAt: now, updatedAt: now, participants: [], basket: {}, games: {} };
const P = (id) => ({ id, name: id, gender: "M", weightKg: 70, role: "drinker", consumptions: [], waterCount: 0, status: "party",
  commune: "", arrivedAt: null, resurrectionLabel: "", resurrectionHour: null, resurrectionMode: "strict", active: true, joinedAt: now, updatedAt: now });
const post = (i, body) => fetch(url(i), { method: "POST", body: JSON.stringify(body) });
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) process.exitCode = 1; };

ok((await post(0, { events: [] })).status === 404, "events en sala inexistente -> 404");
ok((await post(0, empty)).status === 201, "crear sala -> 201");
ok((await post(1, empty)).status === 409, "crear de nuevo (otra instancia) -> 409");
await post(0, { events: [{ type: "ADD_PARTICIPANT", participant: P("ana"), eventId: "add-ana", at: now }] });

// 40 POST {events} simultáneos, uno por trago, repartidos entre instancias. Más 5 PUT de anti-entropía y
// un seed en paralelo (el PUT trae un participante nuevo que también debe sobrevivir).
const evs = Array.from({ length: N }, (_, i) => ({ type: "LOG_DRINK", participantId: "ana",
  consumption: { id: `d${i}`, label: "Piscola", ml: 300, abv: 0.12, ts: now + i }, eventId: `ev-${i}`, at: now + i }));
const t0 = Date.now();
const results = await Promise.all([
  ...evs.map((ev, i) => post(i, { events: [ev] }).then((r) => r.status)),
  ...Array.from({ length: 5 }, (_, i) => fetch(url(i), { method: "PUT", body: JSON.stringify({ ...empty, participants: [P("bea")] }) }).then((r) => r.status)),
  post(1, { seed: { ...empty, participants: [P("caro")] } }).then((r) => r.status),
]);
ok(results.every((s) => s === 200), `46 escrituras concurrentes OK en ${Date.now() - t0} ms (status: ${[...new Set(results)]})`);
// Reintento duplicado de los mismos eventos (cola offline reenviada): idempotente
await Promise.all(evs.slice(0, 10).map((ev, i) => post(i + 1, { events: [ev] })));

for (let i = 0; i < bases.length; i++) {
  await new Promise((r) => setTimeout(r, 1100)); // pasa la micro-caché de lectura
  const s = await (await fetch(url(i), { cache: "no-store" })).json();
  const ana = s.participants.find((p) => p.id === "ana");
  ok(ana?.consumptions.length === N, `instancia ${i}: ana tiene ${ana?.consumptions.length}/${N} tragos`);
  ok(["ana", "bea", "caro"].every((id) => s.participants.some((p) => p.id === id)), `instancia ${i}: participantes ${s.participants.map((p) => p.id)}`);
  ok(s.seen.length === N + 1, `instancia ${i}: seen=${s.seen.length} (esperado ${N + 1})`);
}
console.log("code", code);
