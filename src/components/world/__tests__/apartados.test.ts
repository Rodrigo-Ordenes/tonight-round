import { describe, expect, it } from "vitest";
import { MAPAS } from "../apartados";
import { LAB_ROOM } from "../lab/labRoom";
import { hrefForView, parentOf, resolveView, viewsOf } from "../vista";

// Las URL de hoy (enlaces directos, botón atrás y las pruebas E2E) tienen que seguir llevando al mismo lugar
const BAR = ["preparar", "sinalcohol", "recetario", "piscolometro", "diccionario"];
const MESAS = ["blackjack", "ruleta", "frutillita", "tragamonedas", "tragabar", "jackpot"];

describe("bar: /bar?ver=", () => {
  it("sin ?ver= es la barra (el centro del bar)", () => {
    expect(resolveView(MAPAS.bar, "/bar")).toBe("barra");
    expect(MAPAS.bar.home).toBe("barra");
  });
  it.each(BAR)("?ver=%s abre su estación", (v) => {
    expect(resolveView(MAPAS.bar, "/bar", `?ver=${v}`)).toBe(v);
    expect(hrefForView(MAPAS.bar, v)).toBe(`/bar?ver=${v}`);
    expect(parentOf(MAPAS.bar, v)).toBe("barra");
  });
  it("una estación desconocida o mal escrita deja en la barra", () => {
    for (const s of ["?ver=otra", "?ver=Preparar", "?ver=", "?ver=sin%20alcohol"]) expect(resolveView(MAPAS.bar, "/bar", s)).toBe("barra");
  });
  it("vuelve a /bar sin parámetro", () => {
    expect(hrefForView(MAPAS.bar, "barra", { pathname: "/bar", search: "?ver=recetario" })).toBe("/bar");
  });
  it("tiene exactamente las cinco estaciones y la barra", () => {
    expect(viewsOf(MAPAS.bar).sort()).toEqual(["barra", ...BAR].sort());
  });
});

describe("casino: /casino y /casino/[mesa]", () => {
  it("/casino es el piso", () => {
    expect(resolveView(MAPAS.casino, "/casino")).toBe("piso");
    expect(MAPAS.casino.home).toBe("piso");
  });
  it.each(MESAS)("/casino/%s es su mesa", (m) => {
    expect(resolveView(MAPAS.casino, `/casino/${m}`)).toBe(m);
    expect(hrefForView(MAPAS.casino, m)).toBe(`/casino/${m}`);
    expect(parentOf(MAPAS.casino, m)).toBe("piso");
  });
  it("una mesa que no existe no es del casino (la página da 404)", () => {
    expect(resolveView(MAPAS.casino, "/casino/poker")).toBeNull();
  });
  it("tiene las seis mesas de src/app/casino/[mesa]", () => {
    expect(viewsOf(MAPAS.casino).sort()).toEqual(["piso", ...MESAS].sort());
  });
});

describe("sala: /sala, /sala?codigo=1 y /armar?ver=compra|cuenta", () => {
  it("/sala es el salón y ?codigo=1 abre el código", () => {
    expect(resolveView(MAPAS.sala, "/sala")).toBe("salon");
    expect(resolveView(MAPAS.sala, "/sala", "?codigo=1")).toBe("codigo");
    expect(resolveView(MAPAS.sala, "/sala", "?codigo=0")).toBe("salon");
  });
  it("/armar sin parámetro (o con uno desconocido) es la compra, como hoy en ArmarSection", () => {
    expect(resolveView(MAPAS.sala, "/armar")).toBe("compra");
    expect(resolveView(MAPAS.sala, "/armar", "?ver=compra")).toBe("compra");
    expect(resolveView(MAPAS.sala, "/armar", "?ver=otra")).toBe("compra");
    expect(resolveView(MAPAS.sala, "/armar", "?ver=cuenta")).toBe("cuenta");
  });
  it("escribe la compra y la cuenta como hoy (/armar?ver=…)", () => {
    expect(hrefForView(MAPAS.sala, "compra")).toBe("/armar?ver=compra");
    expect(hrefForView(MAPAS.sala, "cuenta", { pathname: "/sala", search: "?codigo=1" })).toBe("/armar?ver=cuenta");
    expect(hrefForView(MAPAS.sala, "codigo")).toBe("/sala?codigo=1");
  });
  it("la compra, la cuenta y el código vuelven al salón", () => {
    for (const v of ["codigo", "compra", "cuenta"]) expect(parentOf(MAPAS.sala, v)).toBe("salon");
  });
  it("/dividir (redirige en el servidor) y la sala en vivo no son vistas de este mundo", () => {
    expect(resolveView(MAPAS.sala, "/dividir")).toBeNull();
    expect(resolveView(MAPAS.sala, "/carrete/ABCD")).toBeNull();
    expect(resolveView(MAPAS.sala, "/sala/ABCD")).toBeNull();
  });
});

describe("música: /musica", () => {
  it("es la cabina", () => {
    expect(resolveView(MAPAS.musica, "/musica")).toBe("cabina");
    expect(hrefForView(MAPAS.musica, "cabina")).toBe("/musica");
  });
});

describe("laboratorio: ?ver= y un segmento en la misma ruta", () => {
  it("lee y escribe las cajas y la mesa", () => {
    expect(resolveView(LAB_ROOM, "/laboratorio")).toBe("centro");
    expect(resolveView(LAB_ROOM, "/laboratorio", "?ver=azul")).toBe("azul");
    expect(resolveView(LAB_ROOM, "/laboratorio/mesa")).toBe("mesa");
    expect(resolveView(LAB_ROOM, "/laboratorio/silla")).toBeNull();
    expect(hrefForView(LAB_ROOM, "mesa", { pathname: "/laboratorio", search: "?ver=azul" })).toBe("/laboratorio/mesa");
    expect(hrefForView(LAB_ROOM, "azul", { pathname: "/laboratorio/mesa" })).toBe("/laboratorio?ver=azul");
  });
  it("cada vista tiene su punto de vista y cada objeto es una vista", () => {
    for (const v of viewsOf(LAB_ROOM)) expect(LAB_ROOM.viewpoints[v], v).toBeDefined();
    for (const a of LAB_ROOM.anchors) expect(viewsOf(LAB_ROOM)).toContain(a.id);
  });
});

describe("todos los mapas", () => {
  for (const [id, map] of Object.entries({ ...MAPAS, laboratorio: LAB_ROOM })) {
    it(`${id}: ida y vuelta de cada vista`, () => {
      for (const v of viewsOf(map)) {
        const href = hrefForView(map, v)!;
        const [path, search = ""] = href.split("?");
        expect(resolveView(map, path, search), href).toBe(v);
      }
    });
    it(`${id}: todo padre es una vista, el centro no tiene padre y todo llega al centro sin ciclos`, () => {
      const views = new Set(viewsOf(map));
      expect(views.has(map.home)).toBe(true);
      expect(parentOf(map, map.home)).toBeNull();
      for (const [child, parent] of Object.entries(map.parents)) {
        expect(views.has(child), child).toBe(true);
        expect(views.has(parent), parent).toBe(true);
      }
      for (const v of views) {
        let cur: string | null = v;
        const seen = new Set<string>();
        while (cur && cur !== map.home) {
          expect(seen.has(cur), `ciclo en ${v}`).toBe(false);
          seen.add(cur);
          cur = parentOf(map, cur);
        }
        expect(cur, `${v} no llega al centro`).toBe(map.home);
      }
    });
    it(`${id}: ninguna vista sale de dos rutas distintas`, () => {
      const owner = new Map<string, string>();
      for (const r of map.routes) {
        const mine = new Set([r.view, ...Object.values(r.values ?? {}), ...Object.values(r.segments ?? {})]);
        for (const v of mine) {
          expect(owner.get(v) ?? r.path, `${v} en ${owner.get(v)} y ${r.path}`).toBe(r.path);
          owner.set(v, r.path);
        }
      }
    });
  }
});
