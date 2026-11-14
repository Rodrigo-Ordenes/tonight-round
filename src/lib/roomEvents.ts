import type { CarreteState } from "./carreteState";

export type RoomEventKind = "drink" | "water" | "vote" | "song" | "cheers";

export interface RoomEvent {
  /** Estable entre llamadas: la TV la usa para mandar una sola señal por evento */
  key: string;
  participantId: string;
  kind: RoomEventKind;
  at: number;
}

/**
 * Lo que pasó en la sala después de `since`: tragos, vasos de agua, votos de la ronda, pedidos de canciones y
 * brindis. La TV convierte cada uno en una señal que viaja desde el celular de esa persona. Quien salió de la sala
 * no cuenta. Ordenado por hora (y por clave a igual hora, para que el orden sea determinista).
 */
export function roomEvents(state: CarreteState, since: number): RoomEvent[] {
  const present = new Set(state.participants.filter((p) => !p.deleted).map((p) => p.id));
  const out: RoomEvent[] = [];
  const push = (key: string, participantId: string, kind: RoomEventKind, at: number) => {
    if (at > since && present.has(participantId)) out.push({ key, participantId, kind, at });
  };

  for (const p of state.participants) {
    if (p.deleted) continue;
    for (const c of p.consumptions ?? []) push(`d:${c.id}`, p.id, "drink", c.ts);
    for (const w of p.water ?? []) push(`w:${w.id}`, p.id, "water", w.ts);
  }
  const round = state.live?.round;
  // Cambiar el voto es otro evento: la hora va en la clave
  if (round) for (const [pid, v] of Object.entries(round.votes ?? {})) push(`v:${round.id}:${pid}:${v.at}`, pid, "vote", v.at);
  for (const r of state.music?.requests ?? []) push(`s:${r.id}`, r.by, "song", r.at);
  const cheers = state.live?.cheers;
  if (cheers) push(`c:${cheers.id}`, cheers.by, "cheers", cheers.at);

  return out.sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}
