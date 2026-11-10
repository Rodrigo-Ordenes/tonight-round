# Prompt maestro V11.1 — Tonight

Optimizado con la skill **prompt-optimizer** a partir del "Master Prompt V10" (Gemini), del estado del arte (`docs/estado-del-arte-v11.md`) y de la auditoría de diseño (impeccable). Proyecto detectado: Next.js 14 + React 18 + TypeScript + Tailwind 3 + Vitest, sin `CLAUDE.md`.

## 1. Diagnóstico del prompt V10

**Fortalezas**
- Invariantes claros: gratis, sin login, identidad chilena por defecto, nunca "apto para manejar".
- Siete módulos concretos con nombres de acciones y archivos.
- Pide `npm run build` al final.

**Problemas**

| Problema | Impacto | Corrección |
| --- | --- | --- |
| Auditó solo archivos de configuración y nombra componentes que no existían (`TimeBombGame.tsx`, `widmark.ts`, `VisualCocktailGlass.tsx`) | El agente inventa archivos o duplica lo que ya existe | Obligar a leer `src/` antes de proponer y a citar `ruta:línea` |
| Sin flujo de trabajo (todo en un bloque) | Cambios grandes sin plan, sin pruebas y sin revisión | Brainstorming → diseño aprobado → plan → TDD por tarea → revisión final |
| Sin criterios visuales medibles | Resultado "genérico de IA" (degradados, halos, etiquetas sobre títulos) | Piso de calidad de impeccable + detector como compuerta |
| Sin pruebas automáticas | Regresiones en sincronización y cuentas | Vitest con pruebas de la lógica pura (reductor, cuentas, juegos, canasta) |
| No exige verificar en navegador | "Compila" ≠ "funciona" | Probar en 1440 px y 375 px, con datos extremos |
| Mezcla investigación con implementación | Decisiones sin fuente | Investigación con NotebookLM primero, guardada en el repo |
| Sin límites de alcance | Se cuelan pagos, cuentas, dependencias pesadas | Sección "No hacer" explícita |
| No describía dónde corre la app | Propuestas que no sirven en cPanel (Vercel, serverless, Python) | Bloque "Producción" con plan, runtime y límites |
| Paquete sin probar | "Compila" no garantiza que arranque en el hosting | Compuerta: arrancar en limpio el clon de la rama compilada con Node 20 |

**Respuestas que ya da el proyecto** (no hace falta preguntar): stack (package.json), patrones (`src/lib/carreteState.ts` reductor puro + acciones; `useCarreteStore` motor compartido), tokens (`tailwind.config.js`, `globals.css`), pruebas (`npm test`).

## 2. Skills y herramientas recomendadas

| Tipo | Componente | Para qué |
| --- | --- | --- |
| Proceso | `using-superpowers`, `brainstorming` | Fijar enfoque y diseño aprobado antes de construir |
| Proceso | `writing-plans` → `executing-plans` o `subagent-driven-development` | Plan con interfaces y pruebas; ejecución con libro de registro |
| Proceso | `test-driven-development`, `verification-before-completion` | Prueba que falla primero; evidencia antes de afirmar |
| Investigación | NotebookLM (MCP): `notebook_create`, `research_start` (deep), `research_import`, `chat_ask`, `note_save`, `studio_generate` | Estado del arte con fuentes citadas |
| Diseño | `impeccable` (`audit`, `critique`, `polish`, `detect`), `design-taste-frontend`, `emil-design-eng` | Sistema visual sin huellas de IA y con detalle |
| Motion | `animate`, `choreograph`, `review-animations` | Qué animar, con qué curva y duración, y escalonados |
| Móvil | `mobile-native`, `apple-design` | Inputs 16 px, hover con puntero, safe areas, sin rebote |
| Acceso | `design:accessibility-review`, `web-design-guidelines` | Contraste, jerarquía, foco, lectores de pantalla |
| Robustez | `break-ui` | Nombres larguísimos, emoji, cero personas, montos enormes |
| Rendimiento | `react-performance` / `vercel-react-best-practices` | Re-renders, bundles, hidratación |
| Cierre | `verification-loop`, `requesting-code-review`, `finishing-a-development-branch` | Build, pruebas, revisión y PR |
| Publicación | `verification-loop`, `security-review` | Probar el despliegue real y revisar lo expuesto antes de subirlo |
| Modelo | Opus 5.5 para diseño y revisión final; Sonnet 5.5 para ejecutar tareas | Alcance HIGH: varias áreas y 5+ archivos |

## 3. Prompt optimizado — versión completa

```
Eres el equipo de producto de Tonight (repo tonight-round): Next.js 14 App Router, React 18, TypeScript estricto,
Tailwind 3 y Vitest. Tonight es una web app gratuita y sin cuentas para carretes en Chile (por defecto), México,
EE.UU. y Japón: Armar (canasta y presupuesto), Bar (barra/ideas/vaso, recetario, diccionario), Juegos (rondas en
vivo TV + celulares, juegos rápidos), Música (DJ Spotify embebido y pedidos), Cuentas (multi-pagador),
Monstruómetro (Widmark dinámico educativo), Wrapped y Modo TV.

PRODUCCIÓN: tonight.misitio.cl en V2 Networks, plan Crecimiento (cPanel + CloudLinux + LiteSpeed, 1,5 CPU, 3 GB).
Corre en "Setup Node.js App" con Node 20, no en Python (la app es Next.js). Se compila en local y `npm run release:v2` publica la rama
v2-release; cPanel la clona desde Git Version Control, sin Terminal, compilación ni npm install en el hosting. Las salas viven en archivos JSON
(CARRETE_DATA_DIR, por defecto ~/tonight-data), o en Redis REST si hay variables. Guía: docs/despliegue-v2networks.md.

OBJETIVO DE ESTA SESIÓN: <describe aquí la mejora concreta, con el resultado que verá una persona en el carrete>.

INVARIANTES (no se negocian)
- Gratis, sin login, sin dependencias de runtime pesadas o de pago (dev deps de prueba sí).
- Copy en español; CL por defecto; los 4 países siguen funcionando vía useLocale().
- Alcohol: estimaciones estrictamente educativas; jamás "apto para manejar". Lenguaje no punitivo; rojo solo para
  el conductor designado que tomó; nunca premiar a quien toma más.
- Sincronización: toda mutación de sala es una CarreteAction idempotente en src/lib/carreteState.ts (reductor puro
  + merge sin pérdida). No mandar el estado completo.

FLUJO OBLIGATORIO
1. Usa la skill using-superpowers y luego brainstorming: lee primero el código que toca el objetivo (cita ruta:línea),
   resume cómo funciona hoy y propón el diseño en un mensaje. Espera aprobación.
2. Si el objetivo depende de lo que hacen otras apps, investiga con NotebookLM: notebook_create,
   research_start(mode="deep"), research_import(cited_only), chat_ask con preguntas concretas sobre Tonight y
   note_save. Resume hallazgos en docs/ con fuentes.
3. Escribe el diseño en docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md y el plan con writing-plans en
   docs/superpowers/plans/. Cada tarea: archivos, interfaces exactas y la prueba que la prueba.
4. Ejecuta con executing-plans (o subagent-driven-development si hay muchas tareas independientes):
   test-driven-development en cada tarea — escribe la prueba en src/lib/__tests__/, mírala fallar, implementa,
   mírala pasar, `npm test` completo, commit. Registra cada decisión fuera del plan como "Ruling" en el ledger.
5. UI: antes de editar, lee el piso de calidad de impeccable (craft-floor) y aplica emil-design-eng. Para motion usa
   animate (¿debe animarse?, propósito, curva cubic-bezier(0.23,1,0.32,1), ≤ 300 ms) y choreograph para grupos.
   Para móvil usa mobile-native. Para casos extremos usa break-ui.
6. Verificación (verification-loop + verification-before-completion):
   - npm test y npm run build sin errores (el build compila CSS; tsc no).
   - impeccable detect --json sobre src y sobre las rutas en vivo (/, /armar, /bar, /juegos, /musica, /dividir,
     /carrete/<código>, /carrete/tv?code=<código>): cero gradient-text, radial-halo, dark-glow, low-contrast,
     tiny-text, skipped-heading y script-error (hidratación).
   - Navegador a 1440 px y 375 px; sala de prueba creada por la API con un nombre de 48 caracteres y emoji.
   - design:accessibility-review en lo que cambió.
   - Si va a producción: clonar en limpio el resultado de release:v2, arrancar app.js con Node 20 y comprobar
     portada, TV, imagen OG, POST de sala, scripts/carrete-concurrency.mjs y que la sala siga tras reiniciar.
7. Revisión final con requesting-code-review (modelo más capaz) y cierre con finishing-a-development-branch:
   rama propia, commits pequeños y PR con resumen, pruebas y decisiones.

CRITERIOS DE ACEPTACIÓN
- Contraste de texto ≥ 4,5:1; texto funcional ≥ 12 px; inputs 16 px en táctiles; foco visible.
- Sin texto degradado, halos radiales, sombras de color, etiquetas sobre títulos, tarjetas anidadas ni radios > 16 px.
- La hora y cualquier valor que dependa del cliente se calculan en efectos (sin desajustes de hidratación).
- Cada mecánica nueva de sala tiene acción idempotente, merge y prueba.
- Paleta: colores solo desde tailwind.config.js (docs/paleta-v11.md); 500 con texto oscuro, 600+ con texto blanco;
  ningún estado se comunica solo con color. src/lib/__tests__/palette.test.ts debe seguir en verde.
- Todo dato de sala que se muestre como enlace o se guarde en disco se valida en el servidor y tiene tope de tamaño.

NO HACER
- No crear cuentas, pagos, rastreo ni almacenamiento de archivos de terceros sin aprobación explícita.
- No migrar a WebSockets/PartyKit ni cambiar el almacén (src/lib/carreteStore.ts) sin un documento de diseño aprobado.
- No reintroducir el tema Halloween ni el ranking por consumo.
- No hacer commit, push, merge ni subir al hosting sin que se pida.
- No pedir ni guardar contraseñas de cPanel, tokens o datos de .env en el repositorio ni en v2-release.
- No usar funciones que dependan de Vercel (Edge, cron, ISR compartido) ni compilar en el hosting.
- No inventar precios: el catálogo sale de src/data/prices_cl.json.
```

## 4. Prompt optimizado — versión rápida

```
Tonight (Next 14/TS/Tailwind/Vitest). Objetivo: <mejora>. using-superpowers → brainstorming (lee src primero) →
NotebookLM deep research si aplica → writing-plans → executing-plans con TDD por tarea. UI con impeccable
craft-floor + emil-design-eng + animate/choreograph + mobile-native + break-ui. Verifica: npm test, npm run build,
impeccable detect en src y rutas en vivo, navegador 1440/375 px. Invariantes: gratis, sin login, alcohol solo
educativo y no punitivo, toda mutación de sala como acción idempotente. Producción: V2 Networks, Node 20, rama v2-release
clonada desde cPanel, probada antes en limpio. Cierra con requesting-code-review y PR; sin push ni despliegue sin pedirlo.
```

## 5. Por qué estos cambios

| Mejora | Razón |
| --- | --- |
| Leer `src/` y citar ruta:línea antes de proponer | El V10 auditó solo configuración e inventó archivos |
| Brainstorming + diseño aprobado + plan | Cambios grandes con decisiones explícitas y revisables |
| NotebookLM con fuentes | El estado del arte deja de ser opinión y queda versionado |
| TDD en `src/lib/__tests__/` | La lógica de sala, cuentas y juegos es pura: fácil de probar y crítica |
| Detector de impeccable como compuerta | Convierte "que no parezca IA" en un chequeo medible |
| `npm run build` explícito además de tsc | En la V11 un CSS roto pasó tsc y pruebas; solo el build lo detecta |
| Rutas en vivo + datos extremos | Los errores de hidratación y desbordes solo aparecen al renderizar |
| Invariantes de reducción de daños | Alinea con AlcoTrack/Alcohol Tracker: sin castigo ni competencia por tomar |
| Bloque de producción y prueba desde clon limpio | El hosting compartido impone Node, CloudLinux limita node_modules y los procesos se apagan |
| "No hacer" explícito | Evita dependencias de pago, cuentas y cambios de infraestructura no pedidos |

> ¿No es lo que necesitas? Dime qué ajustar, o pide la tarea directamente si quieres que la ejecute.
