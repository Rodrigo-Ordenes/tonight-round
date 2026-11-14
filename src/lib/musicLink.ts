/**
 * «Pon tu música»: entiende enlaces de Spotify (playlist, álbum, canción, artista, podcast, Jam) y de YouTube (lista o
 * video). Todo enlace que llega a la sala pasa por aquí (también en el reductor): solo https, solo los dominios
 * exactos de cada servicio y solo IDs con su forma. Lo que no calza, se descarta.
 */

export type MusicProvider = "spotify" | "youtube";
export type MusicKind = "playlist" | "album" | "track" | "artist" | "episode" | "show" | "jam" | "link" | "list" | "video";

export interface MusicLink {
  provider: MusicProvider;
  kind: MusicKind;
  /** Reproductor para incrustar; null cuando el servicio no lo permite (el Jam se abre en Spotify) */
  embedUrl: string | null;
  /** Enlace normalizado para abrir en la app del servicio */
  openUrl: string;
}

const MAX_LENGTH = 500;
const SPOTIFY_ID = /^[A-Za-z0-9]{10,40}$/;
const SPOTIFY_KINDS = new Set(["playlist", "album", "track", "artist", "episode", "show"]);
const YT_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const YT_LIST = /^[A-Za-z0-9_-]{10,64}$/;
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

const spotify = (kind: string, id: string): MusicLink => ({
  provider: "spotify",
  kind: kind as MusicKind,
  embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
  openUrl: `https://open.spotify.com/${kind}/${id}`,
});

export function parseMusicLink(input: string): MusicLink | null {
  const s = (input ?? "").trim();
  if (!s || s.length > MAX_LENGTH) return null;

  const uri = s.match(/^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]{10,40})$/);
  if (uri) return spotify(uri[1], uri[2]);

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "open.spotify.com" || host === "play.spotify.com") {
    // /intl-es/playlist/ID → sin el prefijo de idioma
    const path = parts[0]?.startsWith("intl-") ? parts.slice(1) : parts;
    const [kind, id] = path;
    if (kind === "socialsession" && id && /^[A-Za-z0-9]{6,64}$/.test(id)) {
      return { provider: "spotify", kind: "jam", embedUrl: null, openUrl: `https://open.spotify.com/socialsession/${id}` };
    }
    if (path.length === 2 && SPOTIFY_KINDS.has(kind) && SPOTIFY_ID.test(id)) return spotify(kind, id);
    return null;
  }

  // Enlace corto de la app (suele ser un Jam): no se sabe qué hay detrás sin abrirlo
  if (host === "spotify.link") {
    const [id] = parts;
    if (parts.length === 1 && /^[A-Za-z0-9]{6,32}$/.test(id)) return { provider: "spotify", kind: "link", embedUrl: null, openUrl: `https://spotify.link/${id}` };
    return null;
  }

  if (YT_HOSTS.has(host) || host === "youtu.be") {
    const openHost = host === "music.youtube.com" ? "music.youtube.com" : "www.youtube.com";
    const list = u.searchParams.get("list");
    // Una lista manda sobre el video (watch?v=…&list=… suena la lista completa)
    if (list && YT_LIST.test(list) && host !== "youtu.be") {
      return {
        provider: "youtube",
        kind: "list",
        embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`,
        openUrl: `https://${openHost}/playlist?list=${list}`,
      };
    }
    const id =
      host === "youtu.be"
        ? parts.length === 1
          ? parts[0]
          : null
        : parts[0] === "watch"
          ? u.searchParams.get("v")
          : (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") && parts.length === 2
            ? parts[1]
            : null;
    if (id && YT_VIDEO.test(id)) {
      return { provider: "youtube", kind: "video", embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, openUrl: `https://${openHost}/watch?v=${id}` };
    }
    return null;
  }

  return null;
}
