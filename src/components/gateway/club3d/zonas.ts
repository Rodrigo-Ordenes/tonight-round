import type { Ambiente } from "@/components/ui/AmbientPhoto";

/**
 * Las zonas del club, una por pared y una por apartado de la app: la Sala, el Bar, el Casino y la pista de Música.
 * Cada pared es su foto real; el punto de neón va sobre el objeto que la representa (`hotspot`, en fracción de la
 * foto: x, y). Meterse en una zona lleva directo a su apartado.
 */
export interface ZonaClub {
  id: "sala" | "bar" | "casino" | "musica";
  title: string;
  sign: string;
  desc: string;
  foto: Ambiente;
  hotspot: [number, number];
  href: string;
}

export const ZONAS_CLUB: ZonaClub[] = [
  {
    id: "sala",
    title: "La sala",
    sign: "SALA",
    desc: "Crea la sala o arma la compra, con la cuenta clara al final.",
    foto: "club",
    hotspot: [0.56, 0.64],
    href: "/sala",
  },
  {
    id: "bar",
    title: "El bar",
    sign: "BAR",
    desc: "El barman te atiende: lo que hay en la mesa, recetas y lo sin alcohol.",
    foto: "bar",
    hotspot: [0.5, 0.58],
    href: "/bar",
  },
  {
    id: "casino",
    title: "El casino",
    sign: "CASINO",
    desc: "Blackjack, ruleta y la Frutillita, solo con puntos.",
    foto: "casino",
    hotspot: [0.42, 0.56],
    href: "/casino",
  },
  {
    id: "musica",
    title: "La pista",
    sign: "DJ",
    desc: "Tu música sonando y, en sala, la fila de todos.",
    foto: "musica",
    hotspot: [0.6, 0.5],
    href: "/musica",
  },
];

/** La última zona visitada (para volver a ella), guardada en el navegador por 12 horas */
const LAST_KEY = "tonight_ultima_zona";
export function rememberZone(id: ZonaClub["id"]) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* sin almacenamiento */
  }
}
export function lastZone(): ZonaClub["id"] | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { id: ZonaClub["id"]; at: number };
    return Date.now() - v.at < 12 * 3600_000 && ZONAS_CLUB.some((z) => z.id === v.id) ? v.id : null;
  } catch {
    return null;
  }
}
