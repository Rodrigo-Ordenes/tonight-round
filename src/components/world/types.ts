/*
 * Tipos del motor de los apartados en primera persona (V14, docs/prompt-v14-inmersivo.md). Un apartado es un
 * «mundo»: sus vistas con nombre (el centro y cada herramienta), cómo se escriben en la URL y, para el 3D, dónde
 * está la cámara en cada vista y dónde está cada objeto que se puede elegir.
 */

export type Vec3 = readonly [number, number, number];

/** 2 = 3D completo, 1 = foto con relieve y paralaje, 0 = el SectionStage de hoy (también mientras carga el 3D) */
export type WorldLevel = 0 | 1 | 2;

export type ApartadoId = "bar" | "casino" | "sala" | "musica" | "laboratorio";

/**
 * Una ruta del apartado y cómo elige su vista. Sin parámetro (o con un valor que no está en `values`) es `view`;
 * `values` traduce `?{param}=valor` a una vista; `segments` traduce `/{path}/{segmento}` a una vista.
 */
export interface ViewRoute {
  path: string;
  view: string;
  param?: string;
  values?: Readonly<Record<string, string>>;
  segments?: Readonly<Record<string, string>>;
}

/** Las vistas de un apartado: su centro (LLEGAR y MIRAR), sus rutas y a qué vista vuelve cada una (VOLVER) */
export interface WorldMap {
  id: ApartadoId;
  home: string;
  routes: readonly ViewRoute[];
  parents: Readonly<Record<string, string>>;
}

/** Dónde se para la cámara en una vista: posición del ojo, a qué mira y su lente vertical (grados) */
export interface Viewpoint {
  position: Vec3;
  target: Vec3;
  fov: number;
}

/** Un objeto elegible de la escena: el id de su opción (StageOption.id), su centro (ahí va su botón) y su caja (m) */
export interface WorldAnchor {
  id: string;
  at: Vec3;
  size: Vec3;
}

/** Un apartado listo para el 3D: su mapa de vistas más la geometría de cada vista y de cada objeto */
export interface WorldRoom extends WorldMap {
  viewpoints: Readonly<Record<string, Viewpoint>>;
  anchors: readonly WorldAnchor[];
}
