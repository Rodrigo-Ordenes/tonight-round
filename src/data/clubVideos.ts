/**
 * Clips de video del club (opcionales). Cuando existan, la pared de esa zona los reproduce en loop en vez de la foto
 * quieta: `public/video/club/<zona>.mp4` (H.264, 1920×1080, sin audio, menos de 3 MB, loop sin corte) y su versión
 * vertical `<zona>-9x16.mp4` para el celular. Ver docs/prompt-club-video.md para generarlos con Gemini (Veo).
 */
export type ZonaClub = "juegos" | "bar" | "musica" | "dividir" | "armar";

export const CLUB_VIDEOS: Partial<Record<ZonaClub, { ancho: string; vertical?: string }>> = {};
