import type { ViewRoute, WorldMap } from "./types";

/*
 * La URL es la fuente de verdad del punto de vista: `?ver=` o la ruta dicen qué se mira, así los enlaces directos, el
 * botón atrás y las pruebas siguen valiendo. Aquí está la traducción en los dos sentidos y el plan de navegación del
 * proceso (ACERCARSE apila una entrada, pasar entre herramientas reemplaza y VOLVER usa el historial si puede).
 * Todo puro: sin React ni navegador.
 */

export type SearchLike = string | URLSearchParams | undefined;
export interface Loc {
  pathname: string;
  search?: string | URLSearchParams;
}

const own = (o: Readonly<Record<string, string>> | undefined, k: string): o is Readonly<Record<string, string>> => !!o && Object.prototype.hasOwnProperty.call(o, k);

/** Parámetros de una búsqueda (con o sin «?», sin el «#» final) en una copia que se puede modificar */
function toParams(s: SearchLike): URLSearchParams {
  if (s instanceof URLSearchParams) return new URLSearchParams(s);
  return new URLSearchParams((s ?? "").split("#")[0]);
}

/** La ruta sin barra final (la raíz queda «/») */
export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/** La vista que muestra una URL del apartado; `null` si la URL no es de este mundo (o es una mesa que no existe) */
export function resolveView(map: WorldMap, pathname: string, search?: SearchLike): string | null {
  const path = normalizePath(pathname);
  const fixed = map.routes.find((r) => r.path === path);
  if (fixed) {
    const value = fixed.param ? toParams(search).get(fixed.param) : null;
    return value !== null && own(fixed.values, value) ? fixed.values[value] : fixed.view;
  }
  for (const r of map.routes) {
    if (!r.segments || !path.startsWith(`${r.path}/`)) continue;
    const rest = path.slice(r.path.length + 1);
    if (rest.includes("/")) continue;
    let seg = rest;
    try {
      seg = decodeURIComponent(rest);
    } catch {
      /* segmento mal codificado: se compara tal cual */
    }
    if (own(r.segments, seg)) return r.segments[seg];
  }
  return null;
}

/** Todas las vistas del apartado, una vez cada una */
export function viewsOf(map: WorldMap): string[] {
  const all = map.routes.flatMap((r) => [r.view, ...Object.values(r.values ?? {}), ...Object.values(r.segments ?? {})]);
  return [...new Set(all)];
}

/** La vista a la que se vuelve desde `view` (VOLVER); `null` en el centro o si la vista no existe */
export function parentOf(map: WorldMap, view: string): string | null {
  return own(map.parents, view) ? map.parents[view] : null;
}

/**
 * La URL canónica de una vista. Prefiere el valor explícito del parámetro (la compra se escribe `/armar?ver=compra`,
 * como hoy) y conserva los demás parámetros de `from` solo si se queda en la misma ruta.
 */
export function hrefForView(map: WorldMap, view: string, from?: Loc): string | null {
  const fromPath = from ? normalizePath(from.pathname) : null;
  const build = (r: ViewRoute, path: string, set?: [string, string]) => {
    const p = fromPath === path ? toParams(from?.search) : new URLSearchParams();
    if (r.param) {
      if (set) p.set(set[0], set[1]);
      else p.delete(r.param);
    }
    const q = p.toString();
    return q ? `${path}?${q}` : path;
  };
  for (const r of map.routes) {
    if (!r.param || !r.values) continue;
    const key = Object.keys(r.values).find((k) => r.values![k] === view);
    if (key !== undefined) return build(r, r.path, [r.param, key]);
  }
  for (const r of map.routes) {
    if (!r.segments) continue;
    const key = Object.keys(r.segments).find((k) => r.segments![k] === view);
    if (key !== undefined) return build(r, `${r.path}/${encodeURIComponent(key)}`);
  }
  const base = map.routes.find((r) => r.view === view);
  return base ? build(base, base.path) : null;
}

export type NavStep = { kind: "push" | "replace"; href: string } | { kind: "back" } | { kind: "none" };

/**
 * Cómo ir de la vista actual a `to`. `previous` es la vista desde la que se llegó a la actual con una entrada propia
 * del historial (el tope de la pila de `trackHistory`; `null` si se llegó por un enlace directo).
 *  - misma vista → nada
 *  - volver al padre que es la entrada anterior → atrás del historial (el gesto atrás y Escape hacen lo mismo)
 *  - volver al padre sin esa entrada (enlace directo) → reemplazar, sin dejar una entrada extra
 *  - una hija de la actual (ACERCARSE) → apilar
 *  - una hermana (otra herramienta del mismo centro) → reemplazar
 *  - el resto → apilar
 */
export function planNav(map: WorldMap, at: Loc & { view: string | null; previous: string | null }, to: string): NavStep {
  if (to === at.view) return { kind: "none" };
  const href = hrefForView(map, to, at);
  if (!href) return { kind: "none" };
  const up = at.view ? parentOf(map, at.view) : null;
  if (at.view && to === up) return at.previous === to ? { kind: "back" } : { kind: "replace", href };
  if (at.view && parentOf(map, to) === at.view) return { kind: "push", href };
  if (at.view && up !== null && parentOf(map, to) === up) return { kind: "replace", href };
  return { kind: "push", href };
}

export type NavCause = "push" | "replace" | "back" | "pop";

/**
 * La pila de vistas desde las que se entró (para saber si VOLVER puede usar el historial). `pop` es un atrás o
 * adelante del navegador que el motor no pidió: si llega al tope de la pila, desapila; si llega a una hija de la
 * vista anterior, apila; si no se entiende, vacía (VOLVER pasa a reemplazar, que nunca falla).
 */
export function trackHistory(map: WorldMap, stack: readonly string[], from: string | null, to: string, cause: NavCause): string[] {
  switch (cause) {
    case "push":
      return from ? [...stack, from] : [...stack];
    case "replace":
      return [...stack];
    case "back":
      return stack.slice(0, -1);
    case "pop":
      if (stack.length > 0 && stack[stack.length - 1] === to) return stack.slice(0, -1);
      if (from && parentOf(map, to) === from) return [...stack, from];
      return [];
  }
}
