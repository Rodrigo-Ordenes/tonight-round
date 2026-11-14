import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { securityHeaders } = require("../securityHeaders.js") as { securityHeaders: { key: string; value: string }[] };
const config = require("../../../next.config.js");
const get = (k: string) => securityHeaders.find((h) => h.key === k)?.value ?? "";

describe("cabeceras de seguridad", () => {
  it("fuerza HTTPS un año", () => expect(get("Strict-Transport-Security")).toContain("max-age=31536000"));
  it("no adivina tipos ni se deja enmarcar", () => {
    expect(get("X-Content-Type-Options")).toBe("nosniff");
    expect(get("X-Frame-Options")).toBe("DENY");
    expect(get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
  it("niega cámara, micrófono y ubicación", () => {
    for (const f of ["camera=()", "microphone=()", "geolocation=()"]) expect(get("Permissions-Policy")).toContain(f);
  });
  it("la CSP restringe orígenes y solo permite marcos de Spotify", () => {
    const csp = get("Content-Security-Policy");
    for (const d of ["default-src 'self'", "frame-src https://open.spotify.com https://www.youtube-nocookie.com", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'"])
      expect(csp).toContain(d);
  });
  it("el optimizador de imágenes está apagado", () => expect(config.images?.unoptimized).toBe(true));
  it("next.config aplica las cabeceras a todas las rutas", async () => {
    const rules = await config.headers();
    expect(rules[0].source).toBe("/:path*");
    expect(rules[0].headers).toEqual(securityHeaders);
  });
});
