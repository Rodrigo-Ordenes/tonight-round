# V14 · Apartados inmersivos en primera persona: plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que cada apartado (Bar, Casino, Sala y Música) sea un recorrido en primera persona guiado por el host: LLEGAR → MIRAR → ELEGIR → ACERCARSE → USAR → VOLVER, sin perder ninguna función de hoy.

**Arquitectura:** un motor común en `src/components/world/`. La URL (`?ver=` o la ruta) es la fuente de verdad del punto de vista; un lienzo persistente (R3F + CameraControls de drei) vive en el layout del apartado y viaja entre puntos de vista con nombre. Sobre el lienzo, una capa DOM paralela pone un botón real encima de cada objeto, y la herramienta de hoy se monta sobre el rectángulo del objeto sin volver a montarse. Tres niveles: 2 = 3D completo, 1 = foto con relieve, 0 = el `SectionStage` actual, que también es lo que se pinta antes de que cargue el 3D.

**Tecnología:** Next.js 15.5 (App Router), React 19, TypeScript, three 0.187, @react-three/fiber 9, drei 10 (CameraControls, PerformanceMonitor, useTexture), @react-three/postprocessing 3, camera-controls 3.1 (dependencia de drei), Vitest 2 (entorno node), Playwright 1.55 con @axe-core/playwright.

**Especificación:** `docs/prompt-v14-inmersivo.md` (el prompt V14 completo). Contexto de diseño: `PRODUCT.md`, `DESIGN.md`, `docs/paleta-v12.md`.

## Restricciones globales

- Todo en español. Sin commit, push, merge, release:v2 ni cambios en cPanel sin autorización explícita (donde este plan diría «commit», el paso es un punto de control sin commit).
- No se pierden funciones: el inventario de la sección siguiente sigue funcionando, con los mismos nombres accesibles.
- No se cambian rutas, parámetros `?ver=` ni los nombres accesibles que usan las pruebas.
- Reducción de daños: siempre hay opción sin alcohol y se puede pasar; nada rojo ni naranjo por tomar. Quien maneja nunca ve alcohol, tampoco botellas en la escena.
- Casino solo con puntos; perder nunca obliga a tomar. Sin casi-premios fabricados, sin celebrar como premio lo que paga menos que lo apostado, fichas que se reponen gratis, sin rachas ni presión para volver.
- Recursos solo con licencia libre verificada (CC0, Mixkit Free License), anotados en su CREDITOS.md. Sin scripts de terceros: respeta la CSP de `src/lib/securityHeaders.js`. Sin dependencias de red de terceros.
- No borres `SectionStage` ni las vistas actuales: son el nivel 0.
- Presupuestos: 60 fps en escritorio y 50 o más en un celular de gama media, medidos; ninguna tarea larga de más de 50 ms al tocar; el nivel 0 carga como hoy; cada escena pesa menos de 3 MB en celular (KTX2, glTF con meshopt, videos -sm).
- Movimiento: entradas de 200–280 ms con `cubic-bezier(0.23, 1, 0.32, 1)`, solo `transform` y `opacity`, nunca `transition-all`; viajes de cámara de 600–900 ms; con movimiento reducido, fundidos en vez de viajes. Objetivos táctiles de 44 px.
- `npm run build` y `next dev` comparten `.next`: no correrlos a la vez.

## Foco de revisión

1. **Dos controles con el mismo nombre a la vez** (al subir de nivel, o el botón en la escena y el de la tira): en todo momento hay exactamente un control por opción. Prueba: Tarea 8, «un solo botón por opción en cada paso».
2. **Subir de nivel mientras se escribe en una herramienta**: la herramienta no se vuelve a montar (conserva lo escrito y el foco). Prueba: Tarea 8, «cambiar de nivel no borra lo escrito».
3. **Escape dentro de un diálogo de la herramienta**: cierra solo el diálogo, no saca de la herramienta. Prueba: Tarea 8, «Escape en un diálogo no cierra la herramienta».
4. **Llegar directo por enlace y volver**: `/bar?ver=preparar` + Escape deja en `/bar` reemplazando (sin entrada extra), y el botón atrás después sale del apartado sin dar vueltas. Pruebas: Tarea 2 (`planNav`, `trackHistory`) y Tarea 8, «enlace directo y Escape».
5. **Celular en vertical (375×812)**: los objetos que quedan fuera del cuadro siguen alcanzables (su botón se asoma por el borde) y nunca salen del árbol de accesibilidad. Pruebas: Tarea 3 (`edgeClamp`) y Tarea 8, «a 375 px todas las opciones quedan dentro».

---

## Inventario (fase 0, 27 de noviembre de 2026)

`node scripts/inventario-v14.mjs` revisa con grep cada punto del inventario del prompt y termina con código 1 si falta algo. Cada fase lo corre al empezar y al cerrar, junto con Vitest y Playwright. Resultado al empezar la fase 0: todo presente salvo los enlaces a `/seguridad`, `/tiempo` y `/mitos`, que no tenían ninguno desde el commit 5be846a (se borró el Navbar viejo con «Retorno» y «Mitos»). Durante la fase 0 la sesión principal los devolvió como opciones con `href`: «Volver seguro» en la sala (con y sin sala), «¿En cuánto se me pasa?» (no para quien maneja) y «Mitos y verdades» en el bar, con su prueba en `e2e/noche.spec.ts`; la fase 0 ya no los toca y el inventario queda en 42 de 42.

---

## Fase 0 · Plan y motor (esta sesión)

### Estructura de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `scripts/inventario-v14.mjs` | Inventario por grep (sin dependencias) |
| `src/components/world/types.ts` | Tipos comunes |
| `src/components/world/vista.ts` | URL ↔ punto de vista y plan de navegación (puro) |
| `src/components/world/apartados.ts` | Tablas de rutas de los cuatro apartados |
| `src/components/world/proyeccion.ts` | Proyección a pantalla, borde, marco de la herramienta, ajuste por aspecto (puro) |
| `src/components/world/niveles.ts` | Techo de nivel, cambios por rendimiento, cuándo subir (puro) |
| `src/components/world/mirar.ts` | MIRAR: arrastre y giroscopio a ±25°, resorte de vuelta (puro) |
| `src/components/world/WorldProvider.tsx` | Contexto: nivel, vista, `go`/`back`, historial, bus para el lienzo |
| `src/components/world/WorldCanvas.tsx` | Lienzo persistente: CameraControls, MIRAR, proyección por cuadro, PerformanceMonitor |
| `src/components/world/DepthBackdrop.tsx` | Foto real con relieve (el sombreador de DepthWall) para lo lejano |
| `src/components/world/ObjectLayer.tsx` | Capa DOM: un botón real por objeto, en la escena o en tira |
| `src/components/world/ToolSlot.tsx` | Paso a la herramienta: el mismo nodo en flujo, en marco o debajo |
| `src/components/world/WorldSectionStage.tsx` | Mismas props que `SectionStage`: nivel 0 = `SectionStage`; ≥1 = el mundo |
| `src/components/world/lab/*`, `src/app/laboratorio/*` | Laboratorio del motor: 404 salvo `TONIGHT_LABORATORIO=1` |
| `src/components/world/__tests__/*.test.ts` | Unitarias (las toma el `include` de `vitest.config.ts`) |
| `e2e/mundo.spec.ts` | E2E del proceso en el laboratorio |

### Tarea 1: inventario y enlaces de cuidado

**Archivos:** crear `scripts/inventario-v14.mjs`. Los enlaces los devolvió la sesión principal en `BarSection.tsx` y `src/app/sala/page.tsx` (con su E2E en `e2e/noche.spec.ts`); esta fase no edita esos archivos.

- [ ] El inventario busca los enlaces fuera de las páginas mismas (`"/seguridad"`, `"/tiempo"`, `"/mitos"` en `src` excluyendo `src/app/<página>`), así detecta si una fase los vuelve a perder.
- [ ] `node scripts/inventario-v14.mjs` → 42 de 42, código 0.

### Tarea 2: tipos y mapa de rutas

**Archivos:** crear `types.ts`, `vista.ts`, `apartados.ts`, `__tests__/vista.test.ts`, `__tests__/apartados.test.ts`.

**Interfaces (produce):**

```ts
type Vec3 = readonly [number, number, number];
type WorldLevel = 0 | 1 | 2;
type ApartadoId = "bar" | "casino" | "sala" | "musica" | "laboratorio";
interface ViewRoute { path: string; view: string; param?: string; values?: Readonly<Record<string, string>>; segments?: Readonly<Record<string, string>> }
interface WorldMap { id: ApartadoId; home: string; routes: readonly ViewRoute[]; parents: Readonly<Record<string, string>> }
interface Viewpoint { position: Vec3; target: Vec3; fov: number }
interface WorldAnchor { id: string; at: Vec3; size: Vec3 }
interface WorldRoom extends WorldMap { viewpoints: Readonly<Record<string, Viewpoint>>; anchors: readonly WorldAnchor[] }
type Loc = { pathname: string; search?: string | URLSearchParams };
resolveView(map: WorldMap, pathname: string, search?: string | URLSearchParams): string | null
hrefForView(map: WorldMap, view: string, from?: Loc): string | null
viewsOf(map: WorldMap): string[]
parentOf(map: WorldMap, view: string): string | null
type NavStep = { kind: "push" | "replace"; href: string } | { kind: "back" } | { kind: "none" };
planNav(map: WorldMap, at: Loc & { view: string | null; previous: string | null }, to: string): NavStep
type NavCause = "push" | "replace" | "back" | "pop";
trackHistory(map: WorldMap, stack: readonly string[], from: string | null, to: string, cause: NavCause): string[]
MAPAS: Record<"bar" | "casino" | "sala" | "musica", WorldMap>
```

Reglas fijadas: `resolveView` quita la barra final, distingue mayúsculas (como hoy `ESTACIONES.includes`), toma el primer valor repetido y devuelve la vista base ante un valor desconocido o vacío; un segmento desconocido o una ruta ajena da `null`. `hrefForView` prefiere el valor explícito del parámetro (`compra` → `/armar?ver=compra`, como escribe hoy ArmarSection) y conserva los demás parámetros solo si se queda en la misma ruta. `planNav`: misma vista → `none`; volver al padre que es la entrada anterior → `back`; hija de la actual → `push`; hermana → `replace`; padre sin historial (enlace directo) → `replace`; el resto → `push`. `trackHistory` con `pop` (atrás o adelante del navegador): si llega al tope de la pila lo saca, si llega a una hija de la vista anterior la apila, si no la vacía.

Mapas: bar `home: "barra"`, `/bar?ver=` con `preparar | sinalcohol | recetario | piscolometro | diccionario` (padres → `barra`); casino `home: "piso"`, `/casino/[mesa]` con `blackjack | ruleta | frutillita | tragamonedas | tragabar | jackpot` (padres → `piso`); sala `home: "salon"`, `/sala?codigo=1` → `codigo` y `/armar` (base `compra`) con `?ver=compra | cuenta` (padres de `codigo`, `compra` y `cuenta` → `salon`); música `home: "cabina"`, `/musica`.

- [ ] Pruebas primero: cada URL de hoy da su vista (los 5 `?ver=` del bar, las 6 mesas, `/armar`, `/armar?ver=cuenta`, `/sala?codigo=1`); `/bar?ver=Preparar`, `/bar?ver=`, `/bar?ver=otra`, `/bar/` → `barra`; `/casino/poker`, `/dividir`, `/carrete/ABCD` → `null`; ida y vuelta `resolveView(hrefForView(v)) === v` para toda vista de todo mapa; `hrefForView(bar, "recetario", { pathname: "/bar", search: "?ver=preparar&x=1" })` → `/bar?ver=recetario&x=1`; `hrefForView(sala, "cuenta", { pathname: "/sala", search: "?codigo=1" })` → `/armar?ver=cuenta`; todo padre es una vista del mapa, el `home` no tiene padre y toda vista llega al `home` sin ciclos; los casos de `planNav` y `trackHistory` de arriba.
- [ ] `npx vitest run src/components/world` → verde.

### Tarea 3: proyección

**Archivos:** crear `proyeccion.ts`, `__tests__/proyeccion.test.ts`.

**Interfaces (produce):**

```ts
interface Viewport { width: number; height: number }
interface Insets { top: number; right: number; bottom: number; left: number }
interface ScreenPoint { x: number; y: number; front: boolean; inside: boolean }
interface ScreenRect { x: number; y: number; width: number; height: number }
projectPoint(viewProj: ArrayLike<number>, p: Vec3, vp: Viewport, out?: ScreenPoint): ScreenPoint
projectBox(viewProj: ArrayLike<number>, center: Vec3, size: Vec3, vp: Viewport): ScreenRect | null
edgeClamp(pt: ScreenPoint, vp: Viewport, inset: Insets, margin?: number): { x: number; y: number; edge: boolean }
toolFrame(obj: ScreenRect | null, vp: Viewport, safe: Insets): ScreenRect
fitForAspect(v: Viewpoint, aspect: number, opts?: { ref?: number; maxFov?: number; maxPull?: number }): Viewpoint
```

Valores fijados: la matriz es column-major como `Matrix4.elements` de three; `edgeClamp` deja el centro del botón a `margin = 28` px del área útil y, detrás de la cámara, invierte la dirección; `toolFrame` usa margen de 12 px, en pantallas de menos de 640 px ocupa todo el ancho útil y en las demás un ancho entre 560 y 880 px centrado en el objeto, siempre dentro de `safe`; `fitForAspect` con `ref = 16/9`, `maxFov = 72`, `maxPull = 1.8` abre primero el lente y después aleja la cámara por la recta objetivo-posición.

- [ ] Pruebas primero con una `PerspectiveCamera` de three (fov 90, aspecto 1, en el origen mirando −Z): `(0,0,-1)` cae al centro; `(1,0,-1)` al borde derecho; `(0,0,1)` da `front: false`; la caja unitaria en `(0,0,-2)` da un rectángulo centrado; una caja entera detrás da `null`; `edgeClamp` de un punto a la derecha fuera de cuadro queda en `x = width - inset.right - 28`; `toolFrame` a 375×812 da ancho `375 - 24 - insets`; a 1440×900 el ancho está entre 560 y 880 y el centro coincide con el del objeto salvo al chocar con el borde; `fitForAspect` no cambia nada con aspecto ≥ 16/9, nunca pasa de 72° y nunca aleja más de 1,8 veces.

### Tarea 4: niveles y MIRAR

**Archivos:** crear `niveles.ts`, `mirar.ts`, `__tests__/niveles.test.ts`, `__tests__/mirar.test.ts`.

**Interfaces (produce):**

```ts
const LEVEL_KEY = "tonight_mundo_nivel";
interface DeviceCaps { webgl: boolean; saveData: boolean; deviceMemory?: number; cores?: number; override: WorldLevel | null }
parseLevel(raw: string | null | undefined): WorldLevel | null
levelCeiling(caps: DeviceCaps): WorldLevel
type PerfEvent = "decline" | "incline" | "fallback";
levelAfter(level: WorldLevel, e: PerfEvent, ceiling: WorldLevel): WorldLevel
shouldUpgrade(s: { ready: boolean; interacted: boolean; viewChanged: boolean }): boolean
const LOOK_LIMIT: number; // 25° en radianes
interface Look { yaw: number; pitch: number; vYaw: number; vPitch: number; tYaw: number; tPitch: number; held: boolean }
createLook(): Look
dragLook(l: Look, dx: number, dy: number, vp: Viewport, fovDeg: number): void
tiltLook(l: Look, gamma: number, beta: number): void
releaseLook(l: Look): void
stepLook(l: Look, dt: number, reduce: boolean): void
```

Reglas fijadas: sin WebGL → 0 siempre; con `override` manda el override (pruebas y el futuro modo tranquilo); ahorro de datos → 0; `deviceMemory ≤ 2` o `cores ≤ 2` → 1; si no, 2. En 0 no hay monitor (queda 0); `decline` baja uno; `incline` sube uno hasta el techo; `fallback` queda en `min(nivel, 1)`. Subir de 0 solo con la escena lista y sin interacción, o en el próximo cambio de vista. MIRAR: yaw positivo mira a la izquierda (`rotateY` de three); arrastrar un ancho de pantalla equivale al campo horizontal; giroscopio `tYaw = -clamp(gamma/20) · LOOK_LIMIT`, `tPitch = clamp((beta-45)/20) · LOOK_LIMIT` (la misma postura cómoda de `useParallax`); soltar devuelve a 0 con el `spring` de `club3d/flow.ts` (k 60, ζ 0,72; con movimiento reducido k 120, ζ 1).

- [ ] Pruebas primero: la tabla de techos; las transiciones de `levelAfter`; `shouldUpgrade`; el arrastre se queda en ±25°; tras soltar y 2 s de pasos, |yaw| < 0,001; sin movimiento reducido se pasa del centro (cruza el cero) y con él no.

### Tarea 5: proveedor y navegación

**Archivos:** crear `WorldProvider.tsx`.

**Interfaces:** consume `vista.ts`, `niveles.ts`, `mirar.ts`. Produce:

```ts
interface WorldBus { anchors: Map<string, HTMLElement>; tool: { el: HTMLElement | null }; look: Look; arrive(view: string): void; ready(): void; perf(e: PerfEvent): void; frame(rect: ScreenRect | null): void }
interface WorldApi { room: WorldRoom; level: WorldLevel; view: string | null; arrived: boolean; reduce: boolean; small: boolean; go(view: string): void; back(): void; bus: WorldBus }
WorldProvider(props: { room: WorldRoom; Scene: React.ComponentType; debug?: boolean; children: React.ReactNode })
useWorld(): WorldApi | null
```

Decisiones: el primer render (servidor y cliente) es nivel 0; la URL se lee en un hijo propio dentro de `<Suspense fallback={null}>` (así `useSearchParams` no deja la página en blanco en el HTML estático); el lienzo entra con `next/dynamic` (`ssr: false`) solo si el techo es ≥ 1, oculto hasta `ready`; `go`/`back` usan `planNav` con `router.push/replace(href, { scroll: false })` o `router.back()` y anotan la causa para `trackHistory`; al volver al padre el foco regresa al botón del objeto; `debug` expone `window.__mundo = { setLevel }` (solo el laboratorio). Un envoltorio `display: contents` lleva `data-mundo-nivel` para las pruebas.

### Tarea 6: lienzo y fondo con relieve

**Archivos:** crear `WorldCanvas.tsx` (export default, cargado dinámico) y `DepthBackdrop.tsx`.

**Interfaces:** consume `WorldBus`, `fitForAspect`, `projectPoint`, `projectBox`, `edgeClamp`, `toolFrame`, `stepLook`. Produce `DepthBackdrop(props: { name: Ambiente; position?: Vec3; width: number; disp?: number; dim?: number })`.

Decisiones: `CameraControls` con todas las acciones en `NONE` (la persona no orbita ni hace zoom) y `smoothTime = 0.26` (≈ 700 ms de viaje, medido); al cambiar la vista, `setLookAt(…, !reduce)` con el punto de vista ajustado al aspecto; con movimiento reducido el lienzo baja su opacidad 120 ms, salta y vuelve en 200 ms. MIRAR se aplica en un `useFrame` de prioridad 0 (después del `update` de CameraControls, que fija la pose en cada cuadro con prioridad −1), solo en el centro del apartado. En el mismo cuadro: proyección de cada ancla a su botón (solo si se movió más de 0,25 px) y, al llegar, el marco de la herramienta. `PerformanceMonitor` (límite de 50 cps) avisa al bus; en el nivel 2 hay `EffectComposer` con Bloom y Vignette, en el 1 no hay posproceso y el `dpr` es 1. Fuera de la pestaña, `frameloop="never"`. `DepthBackdrop` reusa el desplazamiento de `DepthWall` (relieve que se apaga en los bordes) con las fotos `-sm` en pantallas de 700 px o menos.

### Tarea 7: capa DOM y paso a la herramienta

**Archivos:** crear `ObjectLayer.tsx`, `ToolSlot.tsx`, `WorldSectionStage.tsx`.

**Interfaces:** consume `useWorld`, `StageOption`, `HostSays`. Produce `WorldSectionStage(props: React.ComponentProps<typeof SectionStage>)` (las mismas props), `ObjectLayer(props: { title: string; options: StageOption[]; active: string | null; mode: "escena" | "tira"; theme: "neon" | "casino"; onPick(): void })`, `ToolSlot(props: { mode: "flujo" | "marco" | "debajo"; label: string; children: React.ReactNode })`.

Decisiones: sin mundo o en nivel 0, `WorldSectionStage` pinta `<SectionStage>` sin hijos y después `<ToolSlot mode="flujo">` (`display: contents`): el DOM queda como hoy. En nivel ≥ 1 pinta el HUD (eyebrow y h1 con el mismo id y texto, `HostSays` y la capa de objetos, donde también caen las opciones con `href` como los enlaces de cuidado) y el mismo `ToolSlot` en la misma posición del árbol, así la herramienta no se vuelve a montar. `marco` es `position: fixed` con el rectángulo de `toolFrame`, `role="region"` con el nombre de la opción, inerte e invisible hasta que la cámara llega; entonces entra con fundido (opacidad y escala desde 0,98 en 240 ms) y recibe el foco; Escape vuelve (salvo `defaultPrevented` o dentro de un `dialog`) y hay un botón «Volver». `debajo` deja la herramienta en el flujo tras un espaciador de 100 svh (el piso del casino con sus mesas, por ejemplo). La capa de objetos es `<nav aria-label="Opciones: {title}">` con un `<button>` o `<Link>` por opción en el mismo orden de hoy; en `escena` el lienzo mueve cada botón con `transform` y, si su objeto sale del cuadro, lo asoma por el borde; en `tira` los mismos botones se ordenan en fila sobre el marco. Una opción sin ancla en la escena va a una bandeja abajo, nunca se pierde.

### Tarea 8: laboratorio y E2E del proceso

**Archivos:** crear `src/app/laboratorio/layout.tsx` (`dynamic = "force-dynamic"`, `notFound()` salvo `process.env.TONIGHT_LABORATORIO === "1"`), `src/app/laboratorio/page.tsx`, `src/app/laboratorio/[pieza]/page.tsx`, `src/components/world/lab/WorldLab.tsx`, `LabScene.tsx`, `e2e/mundo.spec.ts`. `playwright.config.ts` no se toca (lo comparte la sesión principal): el servidor de las E2E se levanta con `TONIGHT_LABORATORIO=1` (Tarea 9) y, sin la variable, la prueba se salta sola avisando por qué.

El laboratorio tiene tres cajas («Caja azul», «Caja morada», «Caja menta», con `?ver=azul|morado|menta`), una pieza por ruta (`/laboratorio/mesa`), la foto del bar con su relieve detrás y un contador de cuadros en `document.documentElement.dataset.fps`. Cada herramienta tiene un campo «Nota» y un botón que abre un `Modal`.

- [ ] `e2e/mundo.spec.ts` (se salta si `/laboratorio` da 404), para los niveles 0 y 2 (`tonight_mundo_nivel` en `addInitScript`): llegar (h1 «El laboratorio», un solo botón por opción); elegir «Caja azul» → `?ver=azul`; usar (región «Caja azul» visible, foco dentro, escribir en «Nota»); Escape → `/laboratorio` y foco en «Caja azul»; atrás del navegador cierra la herramienta; enlace directo `?ver=morado` + Escape → `/laboratorio` sin entrada nueva; `?ver=xyz` → centro; Escape en el `Modal` cierra solo el diálogo; en nivel 2, el mismo `<canvas>` sigue vivo al pasar a `/laboratorio/mesa`; cambiar de nivel con `window.__mundo.setLevel(0)` no borra la nota; a 375×812 todos los botones quedan dentro de la pantalla; con `reducedMotion: "reduce"` la herramienta aparece en menos de 500 ms; Axe sin violaciones serias en el centro y con la herramienta abierta.

### Tarea 9: verificación de cierre

- [ ] `npx vitest run` (307 de antes + las nuevas, todo verde) y `npx tsc --noEmit`.
- [ ] `npm run build`; servidor standalone en 3105 con `public` y `.next/static` copiados (`SKIP_BUILD=1 PORT=3105 TONIGHT_LABORATORIO=1 bash scripts/e2e-server.sh`).
- [ ] `CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx playwright test --trace=off --workers=1` (54 de antes + las nuevas).
- [ ] `node scripts/inventario-v14.mjs` → todo ✓.
- [ ] Cps medidos en el laboratorio (escritorio y 375×812, con GPU real), capturas de ambos y Axe.
- [ ] Reporte en español: qué cambió, qué se verificó (con números), qué no se pudo y qué sigue. Pedir autorización antes de cualquier commit.

---

## Hoja de ruta: fases 1 a 6

Cada fase empieza leyendo este plan, corre el inventario y escribe su propio plan detallado con writing-plans (`docs/superpowers/plans/AAAA-MM-DD-tonight-v14-fase-N.md`). Todas usan el mismo patrón de integración:

1. Un módulo cliente del apartado en `src/components/world/apartados/<id>/` con su `WorldRoom` (`{ ...MAPAS.<id>, viewpoints, anchors }`), su escena (cargada con `next/dynamic`) y un `<Id>World` que envuelve `WorldProvider`.
2. `src/app/<id>/layout.tsx` (servidor) que pinta `<IdWorld>{children}</IdWorld>`: el lienzo persiste entre las páginas del apartado.
3. En la sección, `SectionStage` → `WorldSectionStage` (mismas props) y su `router.replace` → `useWorld()?.go` con respaldo al de hoy.
4. E2E del proceso (llegar, elegir, acercarse, usar, volver) en niveles 0 y 2, quien maneja con cero botellas, y las pruebas de hoy en verde en ambos niveles.

Piezas comunes que nacen en la primera fase que las necesita y quedan en `world/` para las siguientes: `sonidoEspacial.ts` (fase 1: `PannerNode` HRTF sobre `audioEffects.shared()`, el oído copiado de la cámara cada cuadro; `sfx.ts` recibe un destino opcional), el host en escena (fase 1: `NeonHost` y su versión en oro para el casino) y el HDRI CC0 de Poly Haven para reflejos (fase 1, en `public/hdri/` con su CREDITOS.md).

| Fase | Entrega | Archivos principales | Pruebas que suma |
| --- | --- | --- | --- |
| 1 · Bar | **Funciones reagrupadas por pedido del usuario:** Sin alcohol dentro del Recetario (quien maneja lo ve solo sin alcohol), Diccionario dentro del Recetario o junto a Mitos (por decidir), «¿En cuánto se me pasa?» igual; `?ver=sinalcohol` y `?ver=diccionario` siguen abriendo su parte. Puerta de vaivén; barra 3D en primer plano, contrabarra iluminada y la foto del bar detrás. El host de cantinero pregunta si manejas. Coctelera → «Lo que hay en la mesa», jarra → «Sin alcohol», carta → «Recetario», vaso con regla → «Piscolómetro», pizarra → «Diccionario», posavasos → Mitos y ¿En cuánto se me pasa?. Para quien maneja la contrabarra muestra jugos, aguas y bebidas. | `apartados/bar/*`, `src/app/bar/layout.tsx`, `BarSection.tsx`, `world/sonidoEspacial.ts` | Proceso en el bar; quien maneja: la escena no carga ningún modelo de botella (la escena expone `data-botellas="0"`) y lo sin alcohol va primero |
| 2 · Casino | Cuerda de terciopelo; piso con mesas y fila de máquinas. Elegir enciende la lámpara; sentarse baja la cámara a la altura sentada; en una máquina la pantalla llena la vista y pasa a ser el juego de hoy. «Levantarse» hace el camino inverso. Wheel3D queda en el piso. Host en oro. | `apartados/casino/*`, `src/app/casino/layout.tsx`, `CasinoSection.tsx`, `MesaShell.tsx` | /casino → /casino/blackjack sin cortar el lienzo; créditos en `tonight_casino_creditos` intactos; Levantarse vuelve al piso |
| 3 · Juegos nuevos | Video póker (Jacks or Better), baccarat, rueda de la fortuna y sic bo; blackjack con dividir y seguro. Lógica pura en `src/lib` con la prueba primero (test-driven-development); cada uno con su lugar en el piso y su mesa con MesaShell. | `src/lib/videoPoker.ts`, `baccarat.ts`, `ruedaFortuna.ts`, `sicBo.ts`, `casinoGames.ts`; `MAPAS.casino.segments` + `[mesa]/page.tsx` | Unitarias de pagos y reglas, sin casi-premios ni rachas; E2E de cada mesa |
| 4 · Sala | Salas de club privado (La previa, El living, La terraza, El after) con video propio y fundido; elegir una crea la sala con ese ambiente; «Tengo invitación» une con código; dentro, tres puertas (La compra con la cuenta, Juegos, Música); /carrete/tv usa el video de la sala. Videos Mixkit verificados, en bucle con fundido (ffmpeg), -sm y póster webp. | Grupo de rutas `src/app/(sala)/` con `sala/` y `armar/` (las URL no cambian), `apartados/sala/*`, `public/video/CREDITOS.md` | Crear sala con ambiente; unirse con código; las tres puertas; /armar?ver=compra|cuenta y /dividir intactos |
| 5 · Música y mundo sin cortes | Cabina en primera persona: la fila es la caja de vinilos y Spotify la radio; luces a tempo propio. La zambullida del club cae dentro del apartado sin pantalla negra; el umbral completo solo la primera vez de la noche y después 300 ms. | `apartados/musica/*`, `src/app/musica/layout.tsx`, `ClubStage.tsx` (salida) | MusicDock sigue sonando entre apartados; «Que suene aquí», «Apagar la música», «La fila», «El DJ sugiere» y Spotify |
| 6 · Transversales | Host con memoria y reloj (agua, comida, cómo volver), puerta de salida a /seguridad, presencia de la sala, PWA instalable, tacto y modo tranquilo (`tonight_mundo_nivel = 0`). Cierre con la skill code-review sobre todo V14. | `world/host*`, `public/manifest.webmanifest`, service worker | Instalación PWA; modo tranquilo carga el nivel 0; revisión final |

## Cierre de la fase 0

- Hecho: Tareas 1 a 9. Vitest 425 de 425 (307 de antes + 118 del motor), `tsc --noEmit` sin errores, inventario 42 de 42, `npm run build` en verde (el laboratorio es una ruta dinámica de 144 B; el JS común sigue en 103 kB). E2E completas contra el standalone (puerto 3106, compilado en una copia aislada para no tocar el 3105 de la sesión principal): 66 pasan, 0 fallan, 24 se saltan (las del laboratorio en el proyecto del celular, a propósito, y las que ya se saltaban). Las 11 del laboratorio pasan; viaje de cámara 716–740 ms, con movimiento reducido 134–144 ms.
- Rendimiento medido con GPU real (Apple M1, Chrome con Metal): con el nivel 2 fijo, 60 cps a densidad 1 y 53–60 en retina; en modo automático, escritorio retina se asienta en el nivel 1 a 60 cps y el celular 375×812 en el nivel 2 con 54–60 (promedio 57). El primer toque de la página tiene una tarea larga de 80–225 ms (costo único: el contexto de audio y la primera herramienta); el segundo toque, ninguna. El motor empieza a medir con PerformanceMonitor 1,5 s después de que la escena queda lista (los tirones de la carga bajaban el nivel).
- Cambios respecto de lo escrito arriba: `ToolSlot` solo tiene los modos `marco` y `debajo` (en el nivel 0, `WorldSectionStage` pinta el `SectionStage` de hoy tal cual, sin envoltorio, porque `.page-in` anima a los nietos); el paso entre el nivel 0 y el 3D solo ocurre en el centro o en un cambio de vista (una bajada a 0 con herramienta abierta espera a que se cierre); con `tonight_mundo_nivel` puesto, PerformanceMonitor no cambia el nivel; si solo cambia `?ver=` en la misma ruta, la URL se escribe con `history.pushState/replaceState` (Next sincroniza `useSearchParams` sin pedir la página); el foco vuelve a la opción también en el nivel 0 (`data-option` en SectionStage, aporte de la sesión principal).
- Para las escenas reales (fase 1 en adelante): componer por aspecto para que los botones no se monten a 375 px (en el laboratorio «Caja azul» y «Caja morada» casi se tocan) y que el fondo cubra el cuadro en vertical (la foto no llega abajo); en escritorio retina, probar `dpr` 1,5 para sostener el nivel 2; la portada (`e2e/noche.spec.ts:206`, el club 3D) falla de forma intermitente: el lienzo del club intercepta el clic en «Módulo siguiente» (pasó 1 de 2 veces sola y pasó en la corrida completa final).

**Decisiones abiertas para el usuario** (se preguntan en su fase, no antes): qué modelos 3D se modelan en código y cuáles se traen en glTF con licencia CC0; si la fase 4 puede mover `sala/` y `armar/` a un grupo de rutas (no cambia las URL, sí la carpeta); qué es el modo tranquilo exactamente (nivel 0 o 1).
