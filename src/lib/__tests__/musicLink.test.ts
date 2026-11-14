import { describe, expect, it } from "vitest";
import { parseMusicLink } from "@/lib/musicLink";
import { applyEvent, normalizeCarrete } from "@/lib/carreteState";
import { ev, room } from "./fixtures";

const PL = "37i9dQZF1DX10zKzsJ2jva";

describe("enlaces de música", () => {
  it("playlist de Spotify con /intl-es/ y ?si=: se incrusta y se normaliza", () => {
    expect(parseMusicLink(`https://open.spotify.com/intl-es/playlist/${PL}?si=abc123`)).toEqual({
      provider: "spotify",
      kind: "playlist",
      embedUrl: `https://open.spotify.com/embed/playlist/${PL}`,
      openUrl: `https://open.spotify.com/playlist/${PL}`,
    });
  });

  it("URI de Spotify, álbum, canción y artista", () => {
    expect(parseMusicLink("spotify:album:4aawyAB9vmqN3uQ7FjRGTy")?.embedUrl).toBe("https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy");
    expect(parseMusicLink("https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl")?.kind).toBe("track");
    expect(parseMusicLink("  https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg  ")?.kind).toBe("artist");
  });

  it("Jam y enlaces cortos no se pueden incrustar: se abren en Spotify", () => {
    expect(parseMusicLink("https://open.spotify.com/socialsession/5f2a9c7e1b3d")).toEqual({
      provider: "spotify",
      kind: "jam",
      embedUrl: null,
      openUrl: "https://open.spotify.com/socialsession/5f2a9c7e1b3d",
    });
    expect(parseMusicLink("https://spotify.link/aBcD1234xY")).toEqual({ provider: "spotify", kind: "link", embedUrl: null, openUrl: "https://spotify.link/aBcD1234xY" });
  });

  it("YouTube: lista y video, incrustados sin cookies", () => {
    expect(parseMusicLink("https://www.youtube.com/playlist?list=PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i")).toEqual({
      provider: "youtube",
      kind: "list",
      embedUrl: "https://www.youtube-nocookie.com/embed/videoseries?list=PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i",
      openUrl: "https://www.youtube.com/playlist?list=PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i",
    });
    expect(parseMusicLink("https://youtu.be/dQw4w9WgXcQ?t=42")).toEqual({
      provider: "youtube",
      kind: "video",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      openUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(parseMusicLink("https://m.youtube.com/watch?v=dQw4w9WgXcQ")?.kind).toBe("video");
    const ytm = parseMusicLink("https://music.youtube.com/playlist?list=OLAK5uy_kV2EUo3vS7RXeRzAuDnnYwVphJ0sumg9w");
    expect(ytm?.openUrl).toBe("https://music.youtube.com/playlist?list=OLAK5uy_kV2EUo3vS7RXeRzAuDnnYwVphJ0sumg9w");
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,hola",
    "http://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva",
    "https://spotify.com.evil.io/playlist/37i9dQZF1DX10zKzsJ2jva",
    "https://evilspotify.com/playlist/37i9dQZF1DX10zKzsJ2jva",
    "https://youtube.com.evil.io/watch?v=dQw4w9WgXcQ",
    "https://evil-youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=<script>",
    "https://open.spotify.com/user/alguien",
    "",
  ])("rechaza %j", (input) => expect(parseMusicLink(input)).toBeNull());

  it("rechaza enlaces larguísimos", () => expect(parseMusicLink(`https://open.spotify.com/playlist/${PL}?x=${"a".repeat(600)}`)).toBeNull());
});

describe("la sala solo guarda enlaces de música válidos", () => {
  it("un enlace inválido que llega por la API no cambia la música", () => {
    const before = room();
    const after = applyEvent(before, ev({ type: "SET_MUSIC", patch: { vibeId: "custom", customUrl: "javascript:alert(1)", auto: false } }));
    expect(after.music?.customUrl).toBeUndefined();
    expect(after.music?.vibeId).toBe(before.music?.vibeId);
  });

  it("un enlace válido se guarda normalizado", () => {
    const after = applyEvent(room(), ev({ type: "SET_MUSIC", patch: { vibeId: "custom", customUrl: ` https://open.spotify.com/intl-es/playlist/${PL}?si=x `, auto: false } }));
    expect(after.music?.customUrl).toBe(`https://open.spotify.com/playlist/${PL}`);
    expect(after.music?.vibeId).toBe("custom");
  });
});

describe("un estado completo tampoco cuela enlaces", () => {
  it("al normalizar, un enlace inválido sale y la sala vuelve al DJ", () => {
    const bad = { ...room(), music: { vibeId: "custom", auto: false, customUrl: "javascript:alert(1)", updatedAt: 1 } };
    const s = normalizeCarrete(bad);
    expect(s.music?.customUrl).toBeUndefined();
    expect(s.music?.auto).toBe(true);
  });
  it("un enlace válido se conserva", () => {
    const good = { ...room(), music: { vibeId: "custom", auto: false, customUrl: `https://open.spotify.com/playlist/${PL}`, updatedAt: 1 } };
    expect(normalizeCarrete(good).music?.customUrl).toBe(`https://open.spotify.com/playlist/${PL}`);
  });
});
