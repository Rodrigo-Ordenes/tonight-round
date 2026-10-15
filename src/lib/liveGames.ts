import type { Confession, LiveGame, LiveRound, Participant } from "./carreteState";
import { bacFor } from "./alcohol";
import { CASTIGOS, IMPOSTOR_WORDS, PREFIERES, PROBABLE, VERDAD_O_MITO, YO_NUNCA } from "@/data/party_prompts";

export interface LiveGameDef {
  id: LiveGame;
  name: string;
  emoji: string;
  blurb: string;
  minPlayers: number;
}

export const LIVE_GAMES: LiveGameDef[] = [
  { id: "yonunca", name: "Yo nunca", emoji: "😳", blurb: "La TV lanza la frase, cada uno confiesa en secreto desde su celular.", minPlayers: 2 },
  { id: "probable", name: "¿Quién es más probable?", emoji: "👉", blurb: "Todos votan a alguien de la sala. El más votado cumple.", minPlayers: 3 },
  { id: "prefieres", name: "¿Qué prefieres?", emoji: "⚖️", blurb: "Dos opciones imposibles. La minoría pierde.", minPlayers: 2 },
  { id: "impostor", name: "El Impostor", emoji: "🕵️", blurb: "Todos ven la palabra secreta menos uno. Descríbanla y descubran quién miente.", minPlayers: 3 },
  { id: "confesion", name: "Confesiones anónimas", emoji: "🤫", blurb: "Mandan confesiones desde el celular y adivinan de quién es cada una.", minPlayers: 3 },
  { id: "mito", name: "¿Verdad o mito?", emoji: "🧠", blurb: "Trivia del carrete: los que fallan, cumplen. Se aprende algo.", minPlayers: 2 },
];

export const LIVE_GAME_BY_ID = new Map(LIVE_GAMES.map((g) => [g.id, g]));

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export type NewRound = Omit<LiveRound, "votes" | "revealedAt" | "endedAt">;

/** Arma una ronda nueva evitando repetir frases ya jugadas en la noche. */
export function buildRound(
  game: LiveGame,
  ctx: { participants: Participant[]; confessions: Confession[]; usedPrompts: Set<string> }
): NewRound | { error: string } {
  const people = ctx.participants.filter((p) => !p.deleted);
  const def = LIVE_GAME_BY_ID.get(game)!;
  if (people.length < def.minPlayers) return { error: `Este juego necesita al menos ${def.minPlayers} personas en la sala.` };
  const fresh = <T,>(xs: T[], key: (x: T) => string) => {
    const unused = xs.filter((x) => !ctx.usedPrompts.has(key(x)));
    return pick(unused.length ? unused : xs);
  };
  const base = { id: rid(), game, startedAt: Date.now() };
  const peopleOptions = people.map((p) => ({ id: p.id, label: p.name }));

  switch (game) {
    case "yonunca": {
      const prompt = fresh(YO_NUNCA.flatMap((c) => c.items), (x) => x);
      return { ...base, prompt, options: [{ id: "si", label: "😳 Yo sí" }, { id: "no", label: "😇 Nunca" }] };
    }
    case "probable":
      return { ...base, prompt: fresh(PROBABLE, (x) => x), options: peopleOptions };
    case "prefieres": {
      const q = fresh(PREFIERES, (x) => `${x.a}|${x.b}`);
      return { ...base, prompt: "¿Qué prefieres?", options: [{ id: "a", label: q.a }, { id: "b", label: q.b }] };
    }
    case "mito": {
      const q = fresh(VERDAD_O_MITO, (x) => x.text);
      return {
        ...base,
        prompt: q.text,
        options: [{ id: "verdad", label: "✅ Verdad" }, { id: "mito", label: "❌ Mito" }],
        answer: q.truth ? "verdad" : "mito",
        explain: q.explain,
      };
    }
    case "impostor": {
      const cat = pick(IMPOSTOR_WORDS);
      const impostor = pick(people);
      return {
        ...base,
        prompt: `Categoría: ${cat.cat}. Por turnos, cada uno dice UNA palabra que describa la palabra secreta. Después voten quién es el impostor.`,
        options: peopleOptions,
        answer: impostor.id,
        secret: pick(cat.words),
      };
    }
    case "confesion": {
      const available = ctx.confessions.filter((c) => !c.used && people.some((p) => p.id === c.authorId));
      if (available.length === 0) return { error: "No hay confesiones pendientes. Pídanle a la sala que escriba una desde el celular." };
      const c = pick(available);
      return { ...base, prompt: c.text, options: peopleOptions, answer: c.authorId };
    }
  }
}

export interface TallyRow {
  id: string;
  label: string;
  count: number;
  voterIds: string[];
}

export interface Tally {
  rows: TallyRow[];
  total: number;
  /** Personas que "pierden" la ronda y cumplen castigo */
  loserIds: string[];
  /** Persona destacada (más votada, autor de la confesión, impostor) */
  spotlightId?: string;
  headline: string;
}

export function tally(round: LiveRound, participants: Participant[]): Tally {
  const name = (id?: string) => participants.find((p) => p.id === id)?.name ?? "alguien";
  const rows: TallyRow[] = round.options.map((o) => ({ id: o.id, label: o.label, count: 0, voterIds: [] }));
  Object.entries(round.votes).forEach(([pid, v]) => {
    const r = rows.find((x) => x.id === v.value);
    if (r) {
      r.count += 1;
      r.voterIds.push(pid);
    }
  });
  const total = rows.reduce((a, r) => a + r.count, 0);
  const max = Math.max(0, ...rows.map((r) => r.count));
  const top = rows.filter((r) => r.count === max && max > 0);

  switch (round.game) {
    case "yonunca": {
      const si = rows.find((r) => r.id === "si")!;
      const pct = total ? Math.round((si.count / total) * 100) : 0;
      return { rows, total, loserIds: si.voterIds, headline: si.count === 0 ? "¡Nadie lo ha hecho! (o mienten)" : `${pct}% de la sala lo ha hecho` };
    }
    case "probable":
      return {
        rows,
        total,
        loserIds: top.map((r) => r.id),
        spotlightId: top.length === 1 ? top[0].id : undefined,
        headline: top.length === 0 ? "Nadie votó" : top.length === 1 ? `La sala eligió a ${top[0].label}` : `Empate: ${top.map((t) => t.label).join(" y ")}`,
      };
    case "prefieres": {
      const [a, b] = rows;
      if (a.count === b.count) return { rows, total, loserIds: [], headline: "¡Empate perfecto! Nadie cumple." };
      const minority = a.count < b.count ? a : b;
      return { rows, total, loserIds: minority.voterIds, headline: `Ganó "${(a.count > b.count ? a : b).label}". La minoría cumple.` };
    }
    case "mito": {
      const wrong = rows.filter((r) => r.id !== round.answer).flatMap((r) => r.voterIds);
      return { rows, total, loserIds: wrong, headline: round.answer === "verdad" ? "¡Es VERDAD!" : "¡Es MITO!" };
    }
    case "impostor": {
      const caught = top.length === 1 && top[0].id === round.answer;
      return {
        rows,
        total,
        loserIds: caught ? [round.answer!] : participants.filter((p) => p.id !== round.answer).map((p) => p.id),
        spotlightId: round.answer,
        headline: caught ? `¡Atraparon a ${name(round.answer)}! La palabra era "${round.secret}".` : `${name(round.answer)} los engañó a todos. La palabra era "${round.secret}".`,
      };
    }
    case "confesion": {
      const right = rows.find((r) => r.id === round.answer);
      const fooled = !right || right.count < max || top.length > 1;
      return {
        rows,
        total,
        loserIds: fooled ? participants.filter((p) => p.id !== round.answer).map((p) => p.id) : [round.answer!],
        spotlightId: round.answer,
        headline: fooled ? `Era de ${name(round.answer)} y nadie lo vio venir.` : `Era de ${name(round.answer)}. ¡Lo pillaron!`,
      };
    }
  }
}

/**
 * Castigo con ritmo responsable: quien maneja o ya va alto (≥0,8 g/l estimado) recibe
 * una alternativa sin alcohol automáticamente.
 */
export function penaltyFor(p: Participant, roundId: string, now = Date.now()): { text: string; water: boolean } {
  const bac = bacFor(p, now).bac;
  if (p.role === "driver" || bac >= 0.8) {
    // Determinista por ronda + persona: la TV y el celular muestran lo mismo.
    const h = Array.from(roundId + p.id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return { text: CASTIGOS.sinAlcohol[h % CASTIGOS.sinAlcohol.length], water: true };
  }
  if (bac >= 0.5) return { text: "Un sorbo chico… y después un vaso de agua 💧", water: false };
  return { text: "Toma un sorbo 🍻", water: false };
}
