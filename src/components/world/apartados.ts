import type { WorldMap } from "./types";

/*
 * Las vistas de cada apartado y cómo se escriben en la URL. Son las URL de hoy, sin cambios: el bar con `?ver=`, el
 * casino con una ruta por mesa (src/app/casino/[mesa]), la sala con `?codigo=1` y la compra con `/armar?ver=`. La
 * geometría (dónde va la cámara y cada objeto) la pone cada fase al construir su escena.
 */

const hijos = (padre: string, vistas: readonly string[]) => Object.fromEntries(vistas.map((v) => [v, padre]));
const mismas = (vistas: readonly string[]) => Object.fromEntries(vistas.map((v) => [v, v]));

/** Las estaciones del bar (`ESTACIONES` en BarSection) */
const BAR = ["preparar", "sinalcohol", "recetario", "piscolometro", "diccionario"] as const;
/** Las mesas del casino (`MESAS` en src/app/casino/[mesa]/page.tsx) */
const MESAS = ["blackjack", "ruleta", "frutillita", "tragamonedas", "tragabar", "jackpot"] as const;

export const MAPAS: Readonly<Record<"bar" | "casino" | "sala" | "musica", WorldMap>> = {
  bar: {
    id: "bar",
    home: "barra",
    routes: [{ path: "/bar", view: "barra", param: "ver", values: mismas(BAR) }],
    parents: hijos("barra", BAR),
  },
  casino: {
    id: "casino",
    home: "piso",
    routes: [{ path: "/casino", view: "piso", segments: mismas(MESAS) }],
    parents: hijos("piso", MESAS),
  },
  sala: {
    id: "sala",
    home: "salon",
    routes: [
      { path: "/sala", view: "salon", param: "codigo", values: { "1": "codigo" } },
      // Sin ?ver= (o con uno desconocido) es la compra, como en ArmarSection
      { path: "/armar", view: "compra", param: "ver", values: { compra: "compra", cuenta: "cuenta" } },
    ],
    parents: hijos("salon", ["codigo", "compra", "cuenta"]),
  },
  musica: {
    id: "musica",
    home: "cabina",
    routes: [{ path: "/musica", view: "cabina" }],
    parents: {},
  },
};
