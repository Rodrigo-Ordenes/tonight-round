import { parseMusicLink, type MusicKind, type MusicProvider } from "./musicLink";
import type { CountryCode } from "@/config/locales";
import type { CarreteState, MusicState, SongRequest } from "./carreteState";
import { nightMoment, type MomentKey } from "./nightMoment";

/**
 * DJ del carrete: ambientes con playlists oficiales de Spotify (embebibles sin login),
 * más una recomendación dinámica según la hora, el país, el juego activo y el ritmo de la sala.
 * IDs verificados contra open.spotify.com/embed (oct-2026).
 */
export interface Vibe {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  energy: 1 | 2 | 3 | 4 | 5;
  spotifyId: string;
  moments: MomentKey[];
  /** Ambiente con fuerte afinidad cultural por país */
  countries?: CountryCode[];
  /** Un solo tono por ambiente (sin degradados) */
  tint: string;
}

const TOP_BY_COUNTRY: Record<CountryCode, string> = {
  CL: "37i9dQZEVXbL0GavIqMTeb",
  MX: "37i9dQZEVXbO3qyFxbkOE1",
  US: "37i9dQZEVXbLRQDuF5jeBp",
  JP: "37i9dQZEVXbKXQ4mDTEBXq",
};

const COUNTRY_NAME: Record<CountryCode, string> = { CL: "Chile", MX: "México", US: "EE.UU.", JP: "Japón" };

export function vibesFor(country: CountryCode): Vibe[] {
  return [
    {
      id: "top-pais",
      name: `Top 50 ${COUNTRY_NAME[country]}`,
      emoji: "📈",
      blurb: "Lo que más suena hoy en el país.",
      energy: 4,
      spotifyId: TOP_BY_COUNTRY[country],
      moments: ["previa", "peak"],
      countries: [country],
      tint: "bg-indigo-500/[0.12]",
    },
    {
      id: "reggaeton",
      name: "Baila Reggaetón",
      emoji: "🔥",
      blurb: "Perreo sin pausa para la pista.",
      energy: 5,
      spotifyId: "37i9dQZF1DWY7IeIP1cdjF",
      moments: ["peak"],
      countries: ["CL", "MX"],
      tint: "bg-rose-500/[0.12]",
    },
    {
      id: "dance",
      name: "Dance Party",
      emoji: "🪩",
      blurb: "Pop y electrónica para saltar.",
      energy: 5,
      spotifyId: "37i9dQZF1DXaXB8fQg7xif",
      moments: ["peak"],
      tint: "bg-purple-500/[0.12]",
    },
    {
      id: "latino",
      name: "Viva Latino",
      emoji: "💃",
      blurb: "Lo nuevo de la música latina.",
      energy: 4,
      spotifyId: "37i9dQZF1DX10zKzsJ2jva",
      moments: ["previa", "peak"],
      countries: ["CL", "MX", "US"],
      tint: "bg-amber-400/[0.12]",
    },
    {
      id: "latin-mix",
      name: "Latin Hit Mix",
      emoji: "🌶️",
      blurb: "Clásicos latinos que todos cantan.",
      energy: 4,
      spotifyId: "37i9dQZF1DXbLMw3ry7d7k",
      moments: ["peak", "after"],
      countries: ["CL", "MX"],
      tint: "bg-indigo-500/[0.12]",
    },
    {
      id: "hits",
      name: "Today's Top Hits",
      emoji: "⭐",
      blurb: "Los hits globales del momento.",
      energy: 4,
      spotifyId: "37i9dQZF1DXcBWIGoYBM5M",
      moments: ["previa", "peak"],
      countries: ["US", "JP"],
      tint: "bg-emerald-400/[0.12]",
    },
    {
      id: "rap",
      name: "RapCaviar",
      emoji: "🎤",
      blurb: "Hip-hop para la previa.",
      energy: 4,
      spotifyId: "37i9dQZF1DX0XUsuxWHRQd",
      moments: ["previa", "peak"],
      countries: ["US"],
      tint: "bg-slate-400/[0.12]",
    },
    {
      id: "throwback",
      name: "Throwback Party",
      emoji: "📼",
      blurb: "Temazos de los 2000 y 2010.",
      energy: 4,
      spotifyId: "37i9dQZF1DX7F6T2n2fegs",
      moments: ["peak", "after"],
      tint: "bg-purple-500/[0.12]",
    },
    {
      id: "2000s",
      name: "All Out 2000s",
      emoji: "💿",
      blurb: "La década que todos se saben.",
      energy: 4,
      spotifyId: "37i9dQZF1DX4o1oenSJRJd",
      moments: ["peak", "after"],
      tint: "bg-cyan-400/[0.12]",
    },
    {
      id: "cantar",
      name: "Para cantar a gritos",
      emoji: "🎶",
      blurb: "Karaoke grupal para el cierre.",
      energy: 3,
      spotifyId: "37i9dQZF1DWWMOmoXKqHTD",
      moments: ["after"],
      tint: "bg-amber-400/[0.12]",
    },
    {
      id: "80s",
      name: "All Out 80s",
      emoji: "🕺",
      blurb: "Clásicos ochenteros infalibles.",
      energy: 3,
      spotifyId: "37i9dQZF1DX4UtSsGT1Sbe",
      moments: ["previa", "after"],
      tint: "bg-rose-500/[0.12]",
    },
    {
      id: "rock",
      name: "Rock Classics",
      emoji: "🎸",
      blurb: "Guitarras para la previa.",
      energy: 3,
      spotifyId: "37i9dQZF1DWXRqgorJj26U",
      moments: ["previa"],
      tint: "bg-amber-500/[0.12]",
    },
    {
      id: "mood",
      name: "Mood Booster",
      emoji: "☀️",
      blurb: "Buena onda para ir llegando.",
      energy: 3,
      spotifyId: "37i9dQZF1DX3rxVfibe1L0",
      moments: ["dia", "previa"],
      tint: "bg-amber-300/[0.12]",
    },
    {
      id: "global",
      name: "Top 50 Global",
      emoji: "🌍",
      blurb: "Lo más escuchado del mundo.",
      energy: 4,
      spotifyId: "37i9dQZEVXbMDoHDwVN2tF",
      moments: ["previa", "peak"],
      tint: "bg-cyan-400/[0.12]",
    },
    {
      id: "chill",
      name: "Chill Hits",
      emoji: "🌙",
      blurb: "Bajar las revoluciones.",
      energy: 1,
      spotifyId: "37i9dQZF1DX4WYpdgoIcn6",
      moments: ["dia", "after"],
      tint: "bg-purple-500/[0.12]",
    },
  ];
}

export interface DjContext {
  country: CountryCode;
  now: Date;
  state?: CarreteState | null;
}

export interface DjPick {
  vibe: Vibe;
  reason: string;
}

/** Tragos por persona en la última hora: el "pulso" de la sala. */
export function roomPulse(state?: CarreteState | null, now = Date.now()): number {
  if (!state) return 0;
  const people = state.participants.filter((p) => !p.deleted);
  if (people.length === 0) return 0;
  const recent = people.reduce((acc, p) => acc + p.consumptions.filter((c) => now - c.ts < 3_600_000).length, 0);
  return recent / people.length;
}

/** Ranking de ambientes para este momento. Determinista: todos los dispositivos de la sala sugieren lo mismo. */
export function djSuggestions({ country, now, state }: DjContext): DjPick[] {
  const moment = nightMoment(now);
  const pulse = roomPulse(state, now.getTime());
  let target: number = moment.energy;
  if (pulse >= 1.5) target += 1;
  if (pulse > 0 && pulse < 0.5 && moment.key === "peak") target -= 1;
  target = Math.max(1, Math.min(5, target));

  return vibesFor(country)
    .map((vibe) => {
      let score = 10 - Math.abs(vibe.energy - target) * 3;
      if (vibe.moments.includes(moment.key)) score += 3;
      if (vibe.countries?.includes(country)) score += 2;
      const MOMENT_LABEL: Record<MomentKey, string> = { dia: "la tarde", previa: "la previa", peak: "la noche arriba", after: "el after" };
      let reason = vibe.moments.includes(moment.key) ? `Ideal para ${MOMENT_LABEL[moment.key]}` : "Cambio de aire";
      if (pulse >= 1.5 && vibe.energy >= 5) reason = "La sala está on fire";
      else if (moment.key === "after" && vibe.id === "cantar") reason = "Hora de cantar todos juntos";
      else if (vibe.countries?.includes(country) && vibe.id === "top-pais") reason = "Lo que suena hoy en tu país";
      return { vibe, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ vibe, reason }) => ({ vibe, reason }));
}

export const embedForVibe = (v: Vibe) => `https://open.spotify.com/embed/playlist/${v.spotifyId}?theme=0`;
export const openForVibe = (v: Vibe) => `https://open.spotify.com/playlist/${v.spotifyId}`;
export const youtubeMusicSearch = (q: string) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`;
export const appleMusicSearch = (q: string) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`;

export interface NowPlaying {
  title: string;
  /** Reproductor para incrustar; null para el Jam de Spotify (no se puede incrustar: se abre en la app) */
  embed: string | null;
  open: string;
  provider: MusicProvider;
  kind?: MusicKind;
  vibe?: Vibe;
  reason?: string;
}

/** Lo que está sonando en la sala (resuelve DJ automático vs. elección manual vs. enlace propio validado). */
export function resolveNowPlaying(music: MusicState | undefined, ctx: DjContext): NowPlaying {
  const vibes = vibesFor(ctx.country);
  if (music && !music.auto && music.vibeId === "custom" && music.customUrl) {
    const link = parseMusicLink(music.customUrl);
    if (link) {
      const jam = link.kind === "jam" || link.kind === "link";
      return {
        title: jam ? "Jam del grupo" : link.provider === "youtube" ? "YouTube del grupo" : "Playlist del grupo",
        embed: link.embedUrl ? (link.provider === "spotify" ? `${link.embedUrl}?theme=0` : link.embedUrl) : null,
        open: link.openUrl,
        provider: link.provider,
        kind: link.kind,
        reason: jam ? "Jam de Spotify" : "Elegida por el grupo",
      };
    }
  }
  if (music && !music.auto) {
    const v = vibes.find((x) => x.id === music.vibeId);
    if (v) return { title: v.name, embed: embedForVibe(v), open: openForVibe(v), provider: "spotify", vibe: v, reason: "Elegido por el grupo" };
  }
  const pick = djSuggestions(ctx)[0];
  return {
    title: pick.vibe.name,
    embed: embedForVibe(pick.vibe),
    open: openForVibe(pick.vibe),
    provider: "spotify",
    vibe: pick.vibe,
    reason: `DJ automático · ${pick.reason}`,
  };
}

/** Cola de pedidos pendientes: más votos primero; a igual votos, el más antiguo. */
export function songQueue(music: MusicState | undefined): SongRequest[] {
  return (music?.requests ?? [])
    .filter((r) => !r.played)
    .slice()
    .sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0) || a.at - b.at);
}
