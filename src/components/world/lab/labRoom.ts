import type { WorldRoom } from "../types";

/*
 * El laboratorio del motor: un apartado mínimo para probar el proceso completo (llegar, mirar, elegir, acercarse,
 * usar y volver) sin depender de ninguna escena real. Tres objetos: dos cajas con `?ver=` y una mesa en otra ruta
 * (`/laboratorio/mesa`, para probar que el lienzo persiste entre rutas); la caja menta no tiene objeto en la escena
 * (va a la bandeja). Los objetos van escalonados de alto para que sus botones no se monten en un celular. Solo existe
 * con TONIGHT_LABORATORIO=1 en el servidor.
 */
export const LAB_ROOM: WorldRoom = {
  id: "laboratorio",
  home: "centro",
  routes: [{ path: "/laboratorio", view: "centro", param: "ver", values: { azul: "azul", morado: "morado", menta: "menta" }, segments: { mesa: "mesa" } }],
  parents: { azul: "centro", morado: "centro", menta: "centro", mesa: "centro" },
  viewpoints: {
    centro: { position: [0, 1.6, 5.6], target: [0, 1.05, 0], fov: 50 },
    azul: { position: [-1.9, 1.75, 2.1], target: [-1.9, 1.55, 0], fov: 46 },
    morado: { position: [0, 1.25, 2.6], target: [0, 0.95, 0.4], fov: 46 },
    mesa: { position: [1.9, 1.35, 2.0], target: [1.9, 0.35, 0], fov: 46 },
    menta: { position: [0, 2.0, 3.6], target: [0, 2.2, -7], fov: 50 },
  },
  anchors: [
    { id: "azul", at: [-1.9, 1.55, 0], size: [0.7, 0.7, 0.7] },
    { id: "morado", at: [0, 0.95, 0.4], size: [0.8, 0.8, 0.8] },
    { id: "mesa", at: [1.9, 0.35, 0], size: [1.2, 0.5, 0.8] },
  ],
};
