/**
 * Cabeceras de seguridad de todas las rutas.
 * La CSP mantiene 'unsafe-inline' en scripts y estilos: Next inyecta scripts en línea para hidratar y usar nonces
 * obligaría a renderizar cada página dinámicamente, y la app usa atributos style. Ver docs/despliegue-v2networks.md.
 */
const csp = [
  "default-src 'self'",
  // En desarrollo, el recarga en caliente de Next necesita eval; nunca en producción
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "frame-src https://open.spotify.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: csp },
];

module.exports = { securityHeaders };
