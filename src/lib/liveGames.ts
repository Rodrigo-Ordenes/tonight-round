import type { Confession, LiveGame, LiveRound, Participant } from "./carreteState";
import { bacFor } from "./alcohol";
import { BOMBA_CATEGORIAS, CASTIGOS, DUELOS, IMPOSTOR_WORDS, MIMICA, PREFIERES, PROBABLE, VERDAD_O_MITO, YO_NUNCA } from "@/data/party_prompts";

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
  { id: "duelo", name: "Duelo", emoji: "🥊", blurb: "Dos al centro con un desafío. La sala vota quién ganó y el otro cumple.", minPlayers: 3 },
  { id: "mimica", name: "Mímica", emoji: "🎭", blurb: "Solo quien actúa ve la palabra en su celular. Si no la sacan a tiempo, cumple.", minPlayers: 3 },
  { id: "verdadreto", name: "Verdad o reto", emoji: "🎯", blurb: "La TV elige a alguien y su desafío. Si se arruga, cumple: hay alternativas.", minPlayers: 2 },
  { id: "categorias", name: "Cultura chupística", emoji: "🔥", blurb: "Una categoría y por turnos hacia la derecha. Quien se queda pegado, cumple.", minPlayers: 3 },
];

/** Quienes están al centro de la ronda no se juzgan a sí mismos: no votan y la ronda no espera su voto. */
export function judgedIds(round: Pick<LiveRound, "game" | "answer" | "options">): string[] {
  if ((round.game === "mimica" || round.game === "verdadreto") && round.answer) return [round.answer];
  if (round.game === "duelo") return round.options.map((o) => o.id);
  return [];
}

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
  const seconds: Partial<Record<LiveGame, number>> = { impostor: 45, mimica: 60, duelo: 45, verdadreto: 45, categorias: 45 };
  const base = { id: rid(), game, startedAt: Date.now(), durationMs: (seconds[game] ?? 30) * 1000 };
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
    case "duelo": {
      const a = pick(people);
      const b = pick(people.filter((p) => p.id !== a.id));
      return {
        ...base,
        prompt: `${a.name} vs ${b.name}: ${fresh(DUELOS, (x) => x)}`,
        options: [
          { id: a.id, label: a.name },
          { id: b.id, label: b.name },
        ],
      };
    }
    case "mimica": {
      const cat = pick(MIMICA);
      const actor = pick(people);
      return {
        ...base,
        prompt: `${actor.name} actúa (${cat.cat}). ¡Adivinen antes de que se acabe el tiempo!`,
        options: [
          { id: "si", label: "✅ La sacamos" },
          { id: "no", label: "❌ No la sacamos" },
        ],
        answer: actor.id,
        secret: pick(cat.words),
      };
    }
    case "verdadreto": {
      const who = pick(people);
      const truth = Math.random() < 0.5;
      const text = truth ? fresh(CASTIGOS.verdades, (x) => x) : fresh(CASTIGOS.retos, (x) => x);
      return {
        ...base,
        prompt: `${who.name}, ${truth ? "verdad" : "reto"}: ${text}`,
        options: [
          { id: "si", label: "✅ Cumplió" },
          { id: "no", label: "🙈 Se arrugó" },
        ],
        answer: who.id,
      };
    }
    case "categorias": {
      const starter = pick(people);
      return { ...base, prompt: `${fresh(BOMBA_CATEGORIAS, (x) => x)}. Parte ${starter.name} y sigue hacia la derecha.`, options: peopleOptions };
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
    case "duelo": {
      const [a, b] = rows;
      if (!a || !b) return { rows, total, loserIds: [], headline: "Nadie votó" };
      if (a.count === b.count) return { rows, total, loserIds: [a.id, b.id], headline: total ? "¡Empate! Cumplen los dos." : "Nadie votó: cumplen los dos." };
      const [win, lose] = a.count > b.count ? [a, b] : [b, a];
      return { rows, total, loserIds: [lose.id], spotlightId: win.id, headline: `Ganó ${win.label}. ${lose.label} cumple.` };
    }
    case "mimica":
    case "verdadreto": {
      const si = rows.find((r) => r.id === "si")?.count ?? 0;
      const no = rows.find((r) => r.id === "no")?.count ?? 0;
      const lost = no > si;
      const who = name(round.answer);
      const headline =
        round.game === "mimica"
          ? lost
            ? `No la sacaron: era «${round.secret}». ${who} cumple.`
            : `¡La sacaron! Era «${round.secret}».`
          : lost
            ? `${who} se arrugó: cumple.`
            : `¡${who} cumplió! Aplausos.`;
      return { rows, total, loserIds: lost ? [round.answer!] : [], spotlightId: round.answer, headline };
    }
    case "categorias":
      return {
        rows,
        total,
        loserIds: top.map((r) => r.id),
        spotlightId: top.length === 1 ? top[0].id : undefined,
        headline: top.length === 0 ? "Nadie votó" : top.length === 1 ? `Se quedó pegado: ${top[0].label}` : `Empate: ${top.map((t) => t.label).join(" y ")}`,
      };
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

export type PenaltyKind = "prenda" | "sorbo" | "shot" | "agua" | "verdad" | "paso";

/**
 * Alternativas al castigo que cada persona elige desde su celular: el reto, un sorbo, un shot chico, agua, una verdad
 * o pasar. Con alcoholemia media (0,5 g/l estimado) desaparece el shot; desde 0,8 g/l o si maneja, todo alcohol.
 * Nadie está obligado: siempre hay agua y siempre se puede pasar.
 */
export function penaltyOptions(p: Participant, roundId: string, now = Date.now()): { kind: PenaltyKind; text: string }[] {
  const h = Array.from(roundId + p.id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const at = <T,>(xs: T[], salt = 0) => xs[(h + salt) % xs.length];
  const bac = p.role === "driver" ? Infinity : bacFor(p, now).bac;
  const out: { kind: PenaltyKind; text: string }[] = [{ kind: "prenda", text: `🎭 ${at([...CASTIGOS.suaves, ...CASTIGOS.retos])}` }];
  if (bac < 0.8) out.push({ kind: "sorbo", text: "🍺 Un sorbo" });
  if (bac < 0.5) out.push({ kind: "shot", text: "🥃 Un shot chico" });
  out.push({ kind: "agua", text: "💧 Shot de agua" }, { kind: "verdad", text: `🗣️ ${at(CASTIGOS.verdades, 3)}` }, { kind: "paso", text: "🙅 Paso esta vez" });
  return out;
}

/**
 * ¿Se revela sola la ronda? Cuando votaron todos (con 2 o más personas) o cuando se acabó el tiempo
 * con al menos un voto. Nunca con 0 votos ni dos veces.
 */
export function shouldAutoReveal(round: LiveRound, participantCount: number, now: number): boolean {
  if (round.revealedAt) return false;
  const votes = Object.keys(round.votes).length;
  if (votes === 0) return false;
  // Quien está al centro (actúa, se juzga o se bate a duelo) no vota: no se espera su voto
  if (participantCount >= 2 && votes >= participantCount - judgedIds(round).length) return true;
  return !!round.durationMs && now >= round.startedAt + round.durationMs;
}

/**
 * Quién maneja el reloj (revelado automático y tic): la TV siempre y, entre los celulares, solo quien inició
 * la ronda. Así no hay N celulares revelando con su propia copia de los votos.
 */
export function isRoundDriver(round: Pick<LiveRound, "hostId">, who: { tv: boolean; meId: string | null }): boolean {
  if (who.tv) return true;
  return !!who.meId && round.hostId === who.meId;
}

/** Tiempo restante (ms) acotado a [0, duración]: un reloj atrasado nunca muestra más que la duración. */
export function roundRemaining(round: Pick<LiveRound, "startedAt" | "durationMs">, now: number): number | null {
  if (!round.durationMs) return null;
  return Math.min(round.durationMs, Math.max(0, round.startedAt + round.durationMs - now));
}
