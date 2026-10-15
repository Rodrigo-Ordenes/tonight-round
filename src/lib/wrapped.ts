import type { CarreteState, Participant } from "./carreteState";

export interface Award {
  emoji: string;
  title: string;
  who: string;
  detail: string;
}

export interface WrappedData {
  code: string;
  people: number;
  drinks: number;
  waterLiters: number;
  rounds: number;
  hours: number;
  distinctDrinks: number;
  awards: Award[];
}

const top = <T,>(xs: T[], score: (x: T) => number): T | null => {
  let best: T | null = null;
  let bestScore = 0;
  for (const x of xs) {
    const s = score(x);
    if (s > bestScore) {
      best = x;
      bestScore = s;
    }
  }
  return best;
};

/** Premios de la noche: celebran al grupo y el buen ritmo, no a quien tomó más. */
export function buildWrapped(state: CarreteState): WrappedData {
  const people = state.participants.filter((p) => !p.deleted);
  const history = state.live?.history ?? [];
  const drinks = people.reduce((a, p) => a + p.consumptions.length, 0);
  const waters = people.reduce((a, p) => a + p.waterCount, 0);
  const allTs = people.flatMap((p) => [...p.consumptions.map((c) => c.ts), ...(p.water ?? []).map((w) => w.ts)]);
  const hours = allTs.length > 1 ? (Math.max(...allTs) - Math.min(...allTs)) / 3_600_000 : 0;
  const distinct = new Set(people.flatMap((p) => p.consumptions.map((c) => c.label))).size;

  const awards: Award[] = [];
  const drivers = people.filter((p) => p.role === "driver" && p.consumptions.length === 0);
  if (drivers.length)
    awards.push({ emoji: "👑", title: "Héroe al volante", who: drivers.map((d) => d.name).join(" y "), detail: "0.0 toda la noche. Gracias por llevarlos." });

  const waterKing = top(people, (p) => p.waterCount);
  if (waterKing) awards.push({ emoji: "💧", title: "Maestro del agua", who: waterKing.name, detail: `${waterKing.waterCount} vasos de agua.` });

  const alchemist = top(people, (p) => new Set(p.consumptions.map((c) => c.label)).size);
  if (alchemist && new Set(alchemist.consumptions.map((c) => c.label)).size >= 2)
    awards.push({
      emoji: "🧪",
      title: "Alquimista del bar",
      who: alchemist.name,
      detail: `${new Set(alchemist.consumptions.map((c) => c.label)).size} tragos distintos probados.`,
    });

  const pace = top(
    people.filter((p) => p.role !== "driver" && p.consumptions.length > 0),
    (p) => (p.waterCount + 1) / (p.consumptions.length + 1)
  );
  if (pace && pace.waterCount > 0) awards.push({ emoji: "🧘", title: "Ritmo zen", who: pace.name, detail: "La mejor proporción de agua por trago." });

  const losses = new Map<string, number>();
  const guiltyYoNunca = new Map<string, number>();
  const spotlight = new Map<string, number>();
  history.forEach((h) => {
    (h.guiltyIds ?? []).forEach((id) => {
      losses.set(id, (losses.get(id) ?? 0) + 1);
      if (h.game === "yonunca") guiltyYoNunca.set(id, (guiltyYoNunca.get(id) ?? 0) + 1);
    });
    if (h.game === "probable" && h.winner) spotlight.set(h.winner, (spotlight.get(h.winner) ?? 0) + 1);
  });
  const byId = (id: string | undefined): Participant | undefined => people.find((p) => p.id === id);

  if (history.length >= 3) {
    const survivor = top(people, (p) => history.length - (losses.get(p.id) ?? 0));
    if (survivor) awards.push({ emoji: "🛡️", title: "Sobreviviente de los juegos", who: survivor.name, detail: `Cumplió solo ${losses.get(survivor.id) ?? 0} de ${history.length} rondas.` });
  }
  const shameless = top(Array.from(guiltyYoNunca.entries()), ([, n]) => n);
  if (shameless && byId(shameless[0]))
    awards.push({ emoji: "😳", title: "Sin filtro", who: byId(shameless[0])!.name, detail: `Confesó ${shameless[1]} "yo nunca".` });
  const famous = top(Array.from(spotlight.entries()), ([, n]) => n);
  if (famous && byId(famous[0])) awards.push({ emoji: "🎤", title: "El más votado", who: byId(famous[0])!.name, detail: `La sala lo eligió ${famous[1]} veces.` });

  return {
    code: state.code,
    people: people.length,
    drinks,
    waterLiters: waters * 0.25,
    rounds: history.length,
    hours,
    distinctDrinks: distinct,
    awards,
  };
}

/** Dibuja la tarjeta 1080×1920 (formato historia) en un canvas. */
export async function drawWrapped(canvas: HTMLCanvasElement, d: WrappedData, partyName: string) {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  await document.fonts?.ready;
  const display = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
  const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() || "sans-serif";
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";

  ctx.fillStyle = "#07060A";
  ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(150, 200, 0, 150, 200, 900);
  g1.addColorStop(0, "rgba(255,94,54,0.55)");
  g1.addColorStop(1, "rgba(255,94,54,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(950, 1700, 0, 950, 1700, 1000);
  g2.addColorStop(0, "rgba(156,130,255,0.5)");
  g2.addColorStop(1, "rgba(156,130,255,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  const pad = 90;
  ctx.fillStyle = "#BAB4C2";
  ctx.font = `600 34px ${mono}`;
  ctx.fillText(`TONIGHT WRAPPED · ${d.code}`, pad, 170);

  ctx.fillStyle = "#F7F5F3";
  ctx.font = `800 132px ${display}`;
  ctx.fillText("Qué", pad, 330);
  ctx.fillText("noche.", pad, 460);

  // Estadísticas
  const stats: [string, string][] = [
    [String(d.people), "personas"],
    [String(d.drinks), "tragos"],
    [`${d.waterLiters.toFixed(1)} L`, "de agua"],
    [String(d.rounds), "rondas"],
  ];
  stats.forEach(([n, label], i) => {
    const x = pad + (i % 2) * 460;
    const y = 620 + Math.floor(i / 2) * 190;
    ctx.fillStyle = i === 2 ? "#3EE0FF" : "#F7F5F3";
    ctx.font = `800 110px ${display}`;
    ctx.fillText(n, x, y);
    ctx.fillStyle = "#958EA3";
    ctx.font = `600 38px ${sans}`;
    ctx.fillText(label, x, y + 52);
  });

  // Premios
  ctx.fillStyle = "#BAB4C2";
  ctx.font = `600 32px ${mono}`;
  ctx.fillText("PREMIOS DE LA NOCHE", pad, 1080);
  d.awards.slice(0, 5).forEach((a, i) => {
    const y = 1170 + i * 135;
    ctx.font = `64px ${sans}`;
    ctx.fillText(a.emoji, pad, y + 6);
    ctx.fillStyle = "#F7F5F3";
    ctx.font = `800 52px ${display}`;
    ctx.fillText(a.who, pad + 100, y - 10, W - pad * 2 - 100);
    ctx.fillStyle = "#958EA3";
    ctx.font = `600 32px ${sans}`;
    ctx.fillText(a.title, pad + 100, y + 36, W - pad * 2 - 100);
  });

  ctx.fillStyle = "#FF5E36";
  ctx.font = `800 40px ${display}`;
  ctx.fillText(`El ${partyName.toLowerCase()} se armó en Tonight`, pad, H - 120);
}
