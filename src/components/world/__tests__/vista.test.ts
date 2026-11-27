import { describe, expect, it } from "vitest";
import { hrefForView, normalizePath, parentOf, planNav, resolveView, trackHistory, viewsOf } from "../vista";
import type { WorldMap } from "../types";

// Un mapa de prueba con las dos formas de elegir vista: un parámetro (?ver=) y un segmento de la ruta
const MAPA: WorldMap = {
  id: "laboratorio",
  home: "centro",
  routes: [
    { path: "/lab", view: "centro", param: "ver", values: { azul: "azul", morado: "morado" } },
    { path: "/lab/mesa", view: "mesa" },
    { path: "/piezas", view: "piezas", segments: { uno: "uno", dos: "dos" } },
    { path: "/caja", view: "caja", param: "ver", values: { caja: "caja", tapa: "tapa" } },
  ],
  parents: { azul: "centro", morado: "centro", mesa: "centro", piezas: "centro", uno: "piezas", dos: "piezas", caja: "centro", tapa: "centro" },
};

describe("normalizePath", () => {
  it("quita la barra final salvo en la raíz", () => {
    expect(normalizePath("/lab/")).toBe("/lab");
    expect(normalizePath("/lab")).toBe("/lab");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
  });
});

describe("resolveView", () => {
  it("sin parámetro da la vista base de la ruta", () => {
    expect(resolveView(MAPA, "/lab")).toBe("centro");
    expect(resolveView(MAPA, "/lab/")).toBe("centro");
  });
  it("un valor conocido del parámetro da su vista", () => {
    expect(resolveView(MAPA, "/lab", "?ver=azul")).toBe("azul");
    expect(resolveView(MAPA, "/lab", new URLSearchParams("ver=morado"))).toBe("morado");
    expect(resolveView(MAPA, "/lab", "ver=azul")).toBe("azul");
  });
  it("un valor desconocido, vacío o con otras mayúsculas vuelve a la base (como hoy)", () => {
    expect(resolveView(MAPA, "/lab", "?ver=verde")).toBe("centro");
    expect(resolveView(MAPA, "/lab", "?ver=")).toBe("centro");
    expect(resolveView(MAPA, "/lab", "?ver=Azul")).toBe("centro");
    expect(resolveView(MAPA, "/lab", "?ver=azul%20")).toBe("centro");
  });
  it("un valor que coincide con una propiedad heredada del objeto no cuenta", () => {
    expect(resolveView(MAPA, "/lab", "?ver=constructor")).toBe("centro");
    expect(resolveView(MAPA, "/lab", "?ver=__proto__")).toBe("centro");
    expect(resolveView(MAPA, "/piezas/toString")).toBeNull();
  });
  it("con el parámetro repetido manda el primero, como URLSearchParams.get", () => {
    expect(resolveView(MAPA, "/lab", "?ver=morado&ver=azul")).toBe("morado");
  });
  it("los demás parámetros no cambian la vista", () => {
    expect(resolveView(MAPA, "/lab", "?x=1&ver=azul#algo")).toBe("azul");
  });
  it("un segmento conocido da su vista; uno desconocido o anidado, ninguna", () => {
    expect(resolveView(MAPA, "/piezas/uno")).toBe("uno");
    expect(resolveView(MAPA, "/piezas/dos/")).toBe("dos");
    expect(resolveView(MAPA, "/piezas")).toBe("piezas");
    expect(resolveView(MAPA, "/piezas/tres")).toBeNull();
    expect(resolveView(MAPA, "/piezas/uno/mas")).toBeNull();
  });
  it("una ruta fija gana a un segmento (/lab/mesa no es un valor de /lab)", () => {
    expect(resolveView(MAPA, "/lab/mesa")).toBe("mesa");
  });
  it("una ruta ajena al apartado no es de este mundo", () => {
    expect(resolveView(MAPA, "/otra")).toBeNull();
    expect(resolveView(MAPA, "/labo")).toBeNull();
    expect(resolveView(MAPA, "/")).toBeNull();
  });
});

describe("hrefForView", () => {
  it("escribe la URL canónica de cada vista", () => {
    expect(hrefForView(MAPA, "centro")).toBe("/lab");
    expect(hrefForView(MAPA, "azul")).toBe("/lab?ver=azul");
    expect(hrefForView(MAPA, "mesa")).toBe("/lab/mesa");
    expect(hrefForView(MAPA, "uno")).toBe("/piezas/uno");
    expect(hrefForView(MAPA, "piezas")).toBe("/piezas");
  });
  it("si la vista base también es un valor, prefiere el valor explícito", () => {
    expect(hrefForView(MAPA, "caja")).toBe("/caja?ver=caja");
  });
  it("una vista que no existe no tiene URL", () => {
    expect(hrefForView(MAPA, "nada")).toBeNull();
  });
  it("conserva los demás parámetros solo si se queda en la misma ruta", () => {
    expect(hrefForView(MAPA, "morado", { pathname: "/lab", search: "?ver=azul&x=1" })).toBe("/lab?ver=morado&x=1");
    expect(hrefForView(MAPA, "centro", { pathname: "/lab", search: "?x=1&ver=azul" })).toBe("/lab?x=1");
    expect(hrefForView(MAPA, "tapa", { pathname: "/lab", search: "?x=1" })).toBe("/caja?ver=tapa");
    expect(hrefForView(MAPA, "uno", { pathname: "/piezas/dos", search: "?x=1" })).toBe("/piezas/uno");
  });
  it("ida y vuelta: toda vista vuelve a sí misma", () => {
    for (const v of viewsOf(MAPA)) {
      const href = hrefForView(MAPA, v)!;
      const [path, search = ""] = href.split("?");
      expect(resolveView(MAPA, path, search), href).toBe(v);
    }
  });
});

describe("viewsOf y parentOf", () => {
  it("lista cada vista una sola vez", () => {
    expect(viewsOf(MAPA).sort()).toEqual(["azul", "caja", "centro", "dos", "mesa", "morado", "piezas", "tapa", "uno"]);
  });
  it("el centro no tiene padre; las demás vuelven a su padre", () => {
    expect(parentOf(MAPA, "centro")).toBeNull();
    expect(parentOf(MAPA, "azul")).toBe("centro");
    expect(parentOf(MAPA, "uno")).toBe("piezas");
    expect(parentOf(MAPA, "nada")).toBeNull();
  });
});

describe("planNav: el proceso escribe la URL", () => {
  const at = (view: string | null, previous: string | null, pathname = "/lab", search = "") => ({ view, previous, pathname, search });
  it("ir a la misma vista no hace nada", () => {
    expect(planNav(MAPA, at("azul", "centro", "/lab", "?ver=azul"), "azul")).toEqual({ kind: "none" });
  });
  it("ACERCARSE a una hija apila una entrada (el botón atrás vuelve)", () => {
    expect(planNav(MAPA, at("centro", null), "azul")).toEqual({ kind: "push", href: "/lab?ver=azul" });
  });
  it("pasar a una hermana reemplaza (atrás no recorre cada herramienta)", () => {
    expect(planNav(MAPA, at("azul", "centro", "/lab", "?ver=azul"), "morado")).toEqual({ kind: "replace", href: "/lab?ver=morado" });
  });
  it("VOLVER al padre que es la entrada anterior usa el historial", () => {
    expect(planNav(MAPA, at("azul", "centro", "/lab", "?ver=azul"), "centro")).toEqual({ kind: "back" });
  });
  it("VOLVER al padre tras llegar por enlace directo reemplaza (sin entrada extra)", () => {
    expect(planNav(MAPA, at("azul", null, "/lab", "?ver=azul"), "centro")).toEqual({ kind: "replace", href: "/lab" });
    expect(planNav(MAPA, at("azul", "morado", "/lab", "?ver=azul"), "centro")).toEqual({ kind: "replace", href: "/lab" });
  });
  it("sin vista todavía (antes de leer la URL) apila", () => {
    expect(planNav(MAPA, at(null, null), "azul")).toEqual({ kind: "push", href: "/lab?ver=azul" });
  });
  it("una vista sin URL no navega", () => {
    expect(planNav(MAPA, at("centro", null), "nada")).toEqual({ kind: "none" });
  });
  it("entre vistas sin parentesco apila", () => {
    expect(planNav(MAPA, at("uno", "piezas", "/piezas/uno"), "azul")).toEqual({ kind: "push", href: "/lab?ver=azul" });
  });
});

describe("trackHistory: la pila de dónde se viene", () => {
  it("push apila la vista de origen, replace no cambia nada y back desapila", () => {
    expect(trackHistory(MAPA, [], "centro", "azul", "push")).toEqual(["centro"]);
    expect(trackHistory(MAPA, ["centro"], "azul", "morado", "replace")).toEqual(["centro"]);
    expect(trackHistory(MAPA, ["centro"], "morado", "centro", "back")).toEqual([]);
  });
  it("atrás del navegador hasta el tope de la pila desapila", () => {
    expect(trackHistory(MAPA, ["centro"], "azul", "centro", "pop")).toEqual([]);
  });
  it("adelante del navegador hacia una hija apila", () => {
    expect(trackHistory(MAPA, [], "centro", "azul", "pop")).toEqual(["centro"]);
  });
  it("un salto que no se entiende vacía la pila (VOLVER pasa a reemplazar)", () => {
    expect(trackHistory(MAPA, ["centro"], "azul", "uno", "pop")).toEqual([]);
  });
  it("sin origen no apila", () => {
    expect(trackHistory(MAPA, [], null, "azul", "push")).toEqual([]);
  });
  it("no muta la pila que recibe", () => {
    const stack = ["centro"] as const;
    trackHistory(MAPA, stack, "azul", "centro", "back");
    expect(stack).toEqual(["centro"]);
  });
});
