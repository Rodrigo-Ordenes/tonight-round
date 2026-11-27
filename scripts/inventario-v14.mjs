#!/usr/bin/env node
/*
 * Inventario V14: lo que no se puede perder mientras los apartados se vuelven recorridos en primera persona
 * (docs/prompt-v14-inmersivo.md). Revisa con grep el código fuente y termina con código 1 si falta algo.
 * Cada fase lo corre al empezar y al cerrar, junto con Vitest y Playwright (que prueban el comportamiento).
 * Uso: node scripts/inventario-v14.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const EXT = /\.(tsx?|jsx?|mjs|json)$/;

/** Todos los archivos de código bajo una carpeta (o el archivo mismo) */
function files(path) {
  const abs = join(ROOT, path);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs, { withFileTypes: true }).flatMap((d) => {
    if (d.name === "node_modules" || d.name.startsWith(".")) return [];
    const p = join(path, d.name);
    return d.isDirectory() ? files(p) : EXT.test(d.name) ? [join(ROOT, p)] : [];
  });
}

const cache = new Map();
const read = (f) => {
  if (!cache.has(f)) cache.set(f, readFileSync(f, "utf8"));
  return cache.get(f);
};

/**
 * Cada punto: [área, qué, dónde buscar (carpeta o archivo), patrones (todos deben aparecer), carpeta a excluir].
 * Los textos son los nombres accesibles que usan las pruebas; si una fase los mueve de archivo, siguen en `src`.
 */
const CHECKS = [
  ["/", "4 zonas del club: sala, bar, casino y música", "src/components/gateway/club3d/zonas.ts", [/id: "sala"/, /id: "bar"/, /id: "casino"/, /id: "musica"/]],
  ["/", "host de neón en 3D y en SVG", "src/components/gateway/club3d", [/export default function NeonHost/, /export default function HostNeonSvg/]],
  ["/", "sonido del club", "src/components/gateway/club3d/clubAudio.ts", [/export const clubAudio/]],
  ["/", "giroscopio en el club", "src/components/gateway/ClubStage.tsx", [/askGyro/]],
  ["/", "última zona recordada", "src", ["tonight_ultima_zona"]],
  ["/", "intro «La ronda» que se salta y «Ver la ronda»", "src", ["Saltar intro", "Ver la ronda"]],
  ["navegación", "Sala, Bar, Casino y Música", "src/components/shell/AppShell.tsx", ['label: "Sala"', 'label: "Bar"', 'label: "Casino"', 'label: "Música"']],
  ["navegación", "Juegos solo con sala", "src/components/shell/AppShell.tsx", [/hasRoom \? \[\.\.\.NAV_BASE, NAV_JUEGOS\]/]],
  ["navegación", "MusicDock en el armazón (suena entre páginas)", "src/components/shell/AppShell.tsx", ["<MusicDock"]],
  ["/sala", "Crear sala, Tengo un código y Armar la compra", "src", ["Crear sala", "Tengo un código", "Armar la compra"]],
  ["/sala", "con sala: Juegos de la sala y La compra y la cuenta", "src", ["Juegos de la sala", "La compra y la cuenta"]],
  ["/sala", "/carrete/[code] abre la sala", "src/app/carrete/[code]/page.tsx", [/export default/]],
  ["/sala", "/sala/[code], /carrete, /grupo y /ronda llevan a la sala activa", "src/app", []],
  ["/armar", "?ver=compra|cuenta", "src", [/["'`]cuenta["'`]/, /ver=/]],
  ["/armar", "Varios pagaron y Una boleta", "src", ["Varios pagaron", "Una boleta"]],
  ["/armar", "cobro por WhatsApp en la cuenta", "src/components/calculators", [/WhatsApp/]],
  ["/armar", "/dividir lleva a la cuenta", "src/app/dividir/page.tsx", ["/armar?ver=cuenta"]],
  ["/juegos", "juegos de src/lib/partyGames.ts", "src/lib/partyGames.ts", [/export /]],
  ["/juegos", "votar y revelar", "src", ["Revelar"]],
  ["/juegos", "la palabra solo en el celular de quien actúa", "src", ["Te toca actuar, sin hablar"]],
  ["/juegos", "panel en vivo como cajón", "src", ["Abrir panel en vivo", "Sala en vivo"]],
  ["/carrete/tv", "la pantalla de la sala", "src/app/carrete/tv/page.tsx", [/export default/]],
  ["/bar", "?ver=preparar|sinalcohol|recetario|piscolometro|diccionario", "src", [/["']preparar["']/, /["']sinalcohol["']/, /["']recetario["']/, /["']piscolometro["']/, /["']diccionario["']/]],
  ["/bar", "Lo que hay en la mesa, Sin alcohol, Recetario y Diccionario", "src", ["Lo que hay en la mesa", "Sin alcohol", "Recetario", "Diccionario"]],
  ["/bar", "Piscolómetro con el nombre del país", "src", ["Piscolómetro", /stapleName/]],
  ["/bar", "quien maneja no registra consumo", "src", [/me && !driver/]],
  ["/casino", "las 6 mesas", "src/app/casino/[mesa]/page.tsx", ["blackjack", "ruleta", "frutillita", "tragamonedas", "tragabar", "jackpot"]],
  ["/casino", "ruleta con Wheel3D", "src/components/casino/RuletaMesa.tsx", ["Wheel3D"]],
  ["/casino", "créditos en tonight_casino_creditos", "src", ["tonight_casino_creditos"]],
  ["/casino", "el casino dentro de una sala", "src", ['only="casino"']],
  ["/musica", "Que suene aquí, Apagar la música, La fila y El DJ sugiere", "src", ["Que suene aquí", "Apagar la música", "La fila", "El DJ sugiere"]],
  ["/musica", "fila de YouTube por postMessage", "src/components/music/YouTubeQueuePlayer.tsx", ["postMessage"]],
  ["/musica", "Spotify", "src", ["Spotify"]],
  ["cuidado", "/seguridad: Retorno seguro y check-in", "src/app/seguridad/page.tsx", ["SafeReturnHub"]],
  ["cuidado", "/tiempo: ¿En cuánto se me pasa?", "src/app/tiempo/page.tsx", ["EliminationTimeline"]],
  ["cuidado", "/mitos: Mitos y verdades", "src/app/mitos/page.tsx", ["Mitos y verdades"]],
  ["cuidado", "enlace a /seguridad", "src", [/["'`]\/seguridad["'`]/], "src/app/seguridad"],
  ["cuidado", "enlace a /tiempo", "src", [/["'`]\/tiempo["'`]/], "src/app/tiempo"],
  ["cuidado", "enlace a /mitos", "src", [/["'`]\/mitos["'`]/], "src/app/mitos"],
  ["base", "locales CL, MX, US y JP", "src/config/locales", [/countryCode: "CL"/, /countryCode: "MX"/, /countryCode: "US"/, /countryCode: "JP"/]],
  ["base", "cabeceras de seguridad", "src/lib/securityHeaders.js", ["Content-Security-Policy"]],
  ["base", "optimizador de imágenes apagado", "next.config.js", [/images:\s*\{\s*unoptimized:\s*true\s*\}/]],
];

/** Las rutas que llevan a la sala activa (existen como página) */
const REDIRECTS = ["src/app/sala/[code]/page.tsx", "src/app/carrete/page.tsx", "src/app/grupo/page.tsx", "src/app/ronda/page.tsx"];

let missing = 0;
for (const [area, what, where, patterns, exclude] of CHECKS) {
  const pool = files(where).filter((f) => !exclude || !relative(ROOT, f).split(sep).join("/").startsWith(exclude));
  const faltan =
    what.startsWith("/sala/[code]")
      ? REDIRECTS.filter((p) => !existsSync(join(ROOT, p)) || !/\/carrete\//.test(read(join(ROOT, p))))
      : pool.length === 0
        ? [`(no existe ${where})`]
        : patterns.filter((p) => !pool.some((f) => (typeof p === "string" ? read(f).includes(p) : p.test(read(f))))).map(String);
  if (faltan.length) missing++;
  console.log(`${faltan.length ? "✗" : "✓"} ${area} · ${what}${faltan.length ? `  — falta: ${faltan.join(", ")}` : ""}`);
}
console.log(missing ? `\nFaltan ${missing} de ${CHECKS.length} puntos del inventario.` : `\nInventario completo: ${CHECKS.length} de ${CHECKS.length}.`);
process.exit(missing ? 1 : 0);
