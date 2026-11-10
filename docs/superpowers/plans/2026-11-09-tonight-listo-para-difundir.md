# Tonight lista para difundirse — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar seguridad y privacidad, corregir los críticos de usabilidad y accesibilidad y migrar las pantallas antiguas.

**Architecture:** Cuatro fases independientes y revisables. Cada fase termina verde y con commits propios. La privacidad cambia lo que viaja en la sala (`bodyFactor` en vez de peso y sexo) en el punto único `normalizeParticipant`.

**Tech Stack:** Next.js 14 → 15.5.29, React 18 → 19, TypeScript, Tailwind 3, Vitest. Producción LiteSpeed + Node en cPanel.

**Spec:** `docs/superpowers/specs/2026-11-09-tonight-listo-para-difundir-design.md`

## Global Constraints

- Gratis, sin login, en español; CL por defecto y los 4 países funcionando.
- Alcohol solo educativo, nunca "apto para manejar"; sin castigo ni ranking por consumo.
- Toda mutación de sala es una `CarreteAction` idempotente con merge y prueba.
- Colores solo desde `tailwind.config.js`; ningún estado solo por color.
- Cierre de cada fase: `npm test`, `npx tsc --noEmit` y `npm run build` en verde, con el resultado a la vista.
- **Commit solo con autorización para esa fase.** Sin autorización, la fase queda sin commit y no se empieza la siguiente, para no mezclar fases.
- Sin push, merge, `npm run release:v2` ni cambios en cPanel sin autorización explícita.

## Review Focus

1. Sala creada antes del cambio, con `weightKg` y `gender`: debe seguir estimando igual y perder los datos crudos al normalizar.
2. Celular con la versión antigua cacheada que reenvía peso por PUT: el servidor no debe guardarlo.
3. Diez celulares en una IP consultando cada 700 ms: ninguno recibe 429 en una sala existente.
4. Código de 4 caracteres de una sala activa: se puede unir, abrir en TV y generar su OG.
5. Borrar un gasto y salir de la página antes de los 5 s: el borrado se completa.

---

## Fase 1: mitigación

### Task 1: Cabeceras y optimizador de imágenes

**Files:**
- Create: `src/lib/securityHeaders.js`, `src/lib/__tests__/securityHeaders.test.ts`
- Modify: `next.config.js`
- Maybe create: `src/middleware.ts`

**Interfaces:**
- Produces: `securityHeaders: { key: string; value: string }[]` (CommonJS, lo consume `next.config.js`).

- [ ] **Step 1: Write the failing test** `securityHeaders.test.ts`: existen `Strict-Transport-Security` con `max-age=31536000`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sin cámara, micrófono ni geolocalización. La CSP contiene `default-src 'self'`, `frame-src https://open.spotify.com`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. `next.config.js` exporta `images.unoptimized === true`.
- [ ] **Step 2: Run** `npx vitest run src/lib/__tests__/securityHeaders.test.ts`. Expected: FAIL, módulo inexistente.
- [ ] **Step 3: Implement** los valores anteriores y `headers()` para `/:path*`. CSP: `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob: https:`, `font-src 'self'`, `connect-src 'self'`. Comentar por qué existe `'unsafe-inline'`. Quitar `swcMinify` se deja para la Task 9.
- [ ] **Step 4: Run** el test. Expected: PASS.
- [ ] **Step 5: Verify** con `npm run package:v2` y `node app.js` desde `dist/tonight-v2networks` (Node 20): `curl -I` muestra las cabeceras; la portada, `/musica` (embed de Spotify) y `/carrete/tv` cargan sin violaciones CSP en consola. `curl /_next/image?url=/icon.svg&w=64&q=75` no debe procesar. Si procesa, crear `src/middleware.ts` que responda 404 con `matcher: "/_next/image"` y repetir.

### Task 2: Caché de HTML y guía

**Files:**
- Modify: `docs/despliegue-v2networks.md`

- [ ] **Step 1: Verify** en el arranque local y con `curl -I` a producción si `s-maxage` genera caché compartida (`x-litespeed-cache`, `age`). Probar si `headers()` logra cambiarlo.
- [ ] **Step 2: Document** el resultado, la excepción de CSP, el interruptor «Force HTTPS Redirect» y corregir «Passenger» por «LiteSpeed (lsnode)» donde corresponda.
- [ ] **Step 3: Cierre de fase** y commit si está autorizado.

---

## Fase 2: API, datos y actualización

### Task 3: Privacidad con `bodyFactor`

**Files:**
- Modify: `src/lib/alcohol.ts`, `src/lib/carreteState.ts`, `src/store/useCarreteStore.ts:398-399`, `src/components/carrete/CarreteClientController.tsx:26-27,80`, `src/components/monsters/MonstruometroRanking.tsx:40-41,77,150`, `src/components/carrete/CarreteResurrectionPacing.tsx:100`, `src/lib/__tests__/fixtures.ts`
- Test: `src/lib/__tests__/bodyFactor.test.ts`

**Interfaces:**
- Produces:
  - `bodyFactorFrom(gender: "M" | "F", weightKg: number): number`: `widmarkR(gender) × max(30, kg)`, redondeado al par más cercano y acotado a `[16, 180]`.
  - `computeBac(consumptions, bodyFactor: number, now?, stomach?): BacResult`.
  - `bacFor(p: { consumptions; bodyFactor: number; stomach? }, now?)`.
  - `Participant.bodyFactor: number`, reemplaza `gender` y `weightKg`.
  - `DEFAULT_BODY_FACTOR = bodyFactorFrom("M", 75)`.

- [ ] **Step 1: Write the failing tests:**
  - `bodyFactorFrom("M", 75) === 52`, `bodyFactorFrom("F", 60)` es par.
  - Para pesos de 50 a 100 kg y ambos sexos, el g/l con factor difiere ≤ 3 % del g/l con `r × kg` exacto.
  - `normalizeParticipant({ ...p, weightKg: 80, gender: "F" })` devuelve `bodyFactor === bodyFactorFrom("F", 80)` y sin las claves `weightKg` ni `gender`.
  - Review Focus 2: `mergeCarrete(servidor, { participante con weightKg }, "a")` no contiene `weightKg` en ningún participante.
  - `PATCH_PARTICIPANT` con `{ weightKg: 90 }` no deja esa clave.
  - Sin factor ni datos antiguos, usa `DEFAULT_BODY_FACTOR`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Conversión y borrado en `normalizeParticipant`. Los formularios calculan `bodyFactor` al enviar. `CarreteClientController` guarda `{ gender, weightKg }` en `localStorage` bajo `tonight_body` con try/catch y lo usa para rellenar. Quitar peso y sexo de `MonstruometroRanking.tsx:150` y `CarreteResurrectionPacing.tsx:100`.
- [ ] **Step 4: Run** `npm test` y `npx tsc --noEmit`. Expected: PASS, sin usos de `.weightKg` fuera de `EliminationTimeline` y `types/party`.

### Task 4: Validación de datos

**Files:**
- Modify: `src/lib/carreteState.ts`, `src/components/carrete/CarreteClientController.tsx`, `src/components/monsters/MonstruometroRanking.tsx`, `src/components/calculators/SplitStudio.tsx`
- Test: `src/lib/__tests__/limits.test.ts`

**Interfaces:**
- Produces: `LIMITS = { name: 30, text: 280, label: 60, amount: 100_000_000, participants: 60 }`.

- [ ] **Step 1: Write the failing tests:** un nombre de 44 caracteres queda en 30 (sin cortar un emoji por la mitad, con `Array.from`); un gasto de `1e12` queda en `amount`; confesión y canción cortadas a `text`; ítem de «Yo llevo» a `label`; una sala no supera `participants` por `ADD_PARTICIPANT`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** en el reductor y en `normalizeParticipant`; agregar `maxLength` en los formularios.
- [ ] **Step 4: Run.** Expected: PASS.

### Task 5: Límites por IP

**Files:**
- Create: `src/lib/rateLimit.ts`
- Modify: `src/app/api/carrete/[code]/route.ts`
- Test: `src/lib/__tests__/rateLimit.test.ts`

**Interfaces:**
- Produces: `clientKey(headers: Headers): string` (entrada derecha de `x-forwarded-for`, o `"shared"`; devuelve un hash, nunca la IP); `createLimiter(dir: string | null): { hit(bucket: "create" | "miss" | "write", key: string, now?: number): Promise<{ ok: boolean; retryAfter: number }> }`.
- Valores: `create` 20 por hora, `miss` 60 por minuto, `write` 1200 por minuto. Ventana fija; archivos en `<dir>/.rate/`; escritura atómica; sin `dir`, memoria.

- [ ] **Step 1: Write the failing tests:** `x-forwarded-for: 1.1.1.1, 2.2.2.2` usa `2.2.2.2`; la clave no contiene la IP; el intento 21 de `create` da `ok: false` con `retryAfter > 0`; la ventana siguiente vuelve a permitir; dos limitadores sobre el mismo directorio comparten el conteo. Review Focus 3: 2.000 `hit` no existen en lecturas porque GET de sala existente no llama al limitador (test de la ruta con almacén simulado).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** GET: solo cuenta `miss` al devolver 404. POST crear: `create`. POST eventos y PUT: `write`. 429 con `Retry-After` y `{ error: "rate_limited", message: "Muchas acciones seguidas. Espera un momento e intenta de nuevo." }`. El cliente trata 429 como un fallo más (backoff existente).
- [ ] **Step 4: Run.** Expected: PASS.

### Task 6: Capacidad en disco

**Files:**
- Modify: `src/lib/carreteFileStore.ts`, `src/app/api/carrete/[code]/route.ts`
- Test: `src/lib/__tests__/carreteFileStore.test.ts`

**Interfaces:**
- Produces: `createFileStore(dir, opts?: { maxRooms?: number; maxBytes?: number })` con 2000 y 200 MB por defecto; `StoreFullError`.

- [ ] **Step 1: Write the failing tests:** con `maxRooms: 2`, una tercera sala nueva lanza `StoreFullError`, pero actualizar una existente funciona; ídem con `maxBytes`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** contando con `readdir` y `stat`, con caché de 30 s por proceso. La ruta responde 503 `{ error: "full", message: "Hay demasiadas salas activas. Intenta en un rato." }`.
- [ ] **Step 4: Run.** Expected: PASS.

### Task 7: Códigos de 6 caracteres

**Files:**
- Modify: `src/lib/carreteState.ts:677-684`, `src/app/carrete/tv/page.tsx:48`, `src/app/carrete/[code]/opengraph-image.tsx:9`, `src/components/gateway/CarreteGatewayModal.tsx:71-153`, `src/components/shell/LiveRoomPanel.tsx:45`
- Test: `src/lib/__tests__/codes.test.ts`

**Interfaces:**
- Produces: `CODE_RE = /^[A-Z0-9]{4}([A-Z0-9]{2})?$/`; `randomCode(): string` de 6 caracteres con `crypto.getRandomValues`.

- [ ] **Step 1: Write the failing tests:** `randomCode()` mide 6 y cumple `CODE_RE`; `ABCD` y `ABCDEF` valen; `ABCDE` y `../X` no.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** La entrada del inicio muestra 6 casillas y permite enviar con 4 o 6. Review Focus 4: verificar a mano una sala `ABCD`.
- [ ] **Step 4: Run.** Expected: PASS.

### Task 8: Texto de privacidad

**Files:**
- Modify: `src/components/carrete/CarreteClientController.tsx:89`

- [ ] **Step 1:** Reemplazar por: «Con tu peso y sexo estimamos tu alcoholemia, solo como referencia. Esos dos datos quedan en este celular. Tu nombre y lo que registras se comparten con la sala y se borran a las 48 h sin actividad.»
- [ ] **Step 2: Cierre de fase** y commit si está autorizado.

### Task 9: Next 15.5.29 (commit aparte)

**Files:**
- Modify: `package.json`, `package-lock.json`, `next.config.js`, `src/app/api/carrete/[code]/route.ts:11-78`, `src/app/carrete/[code]/opengraph-image.tsx:8-9`, `src/app/carrete/[code]/layout.tsx:3-4`

- [ ] **Step 1:** Instalar `next@15.5.29`, `react@19`, `react-dom@19`, `@types/react@19`, `@types/react-dom@19`. Quitar `swcMinify`.
- [ ] **Step 2:** `params` pasa a `Promise<{ code: string }>` con `await`.
- [ ] **Step 3: Verify:** `npm audit --omit=dev` sin críticos ni altos sin justificar; `npm test`; `npm run package:v2`; `node app.js` con Node 20 sirve portada, TV, OG de sala y POST; `scripts/carrete-concurrency.mjs` sin FAIL.

---

## Fase 3: usabilidad y accesibilidad

### Task 10: Modal único

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Modify: `DisclaimerModal.tsx:42`, `AppShell.tsx:195`, `SearchableProductModal.tsx:77`, `CustomizableRoulette.tsx:183`, `MonstruometroRanking.tsx:341,360`, `CarreteResurrectionPacing.tsx:187`

**Interfaces:**
- Produces: `<Modal open onClose labelledBy|label dismissible? className>`, sobre `<dialog>` con `showModal()`. `dismissible={false}` cancela el evento `cancel` y el clic en el fondo. Devuelve el foco al cerrar.

- [ ] **Step 1:** Implementar y reemplazar los 7. `CheersOverlay` queda fuera porque no es interactivo.
- [ ] **Step 2: Verify en navegador:** con teclado, el foco queda dentro, Escape cierra (salvo edad) y el foco vuelve.

### Task 11: Sala «Ahora» y «Más», barra fija y foco en la hora

**Files:**
- Create: `src/components/carrete/QuickActionBar.tsx`, `src/lib/lastDrink.ts`
- Modify: `src/components/carrete/CarreteClientController.tsx`, `src/components/ui/DisclaimerModal.tsx`
- Test: `src/lib/__tests__/lastDrink.test.ts`

**Interfaces:**
- Produces: `lastDrink(consumptions: Consumption[]): Consumption | null` (el de mayor `ts`, con `abv > 0`).

- [ ] **Step 1: Write the failing test:** devuelve el último con alcohol; `null` sin tragos.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Barra con `bottom: calc(84px + env(safe-area-inset-bottom))` y padding inferior de `main` aumentado solo en vista celular. Sin trago previo, el botón abre el selector. Hero: «Vuelves a 0.00 cerca de las HH:MM» más «Estimación. No sirve para decidir si manejar.»; g/l secundario. Pestañas en `?panel=mas`. Quitar el aviso duplicado de la línea 475. Aviso de edad compacto si la URL es `/carrete/[code]`.
- [ ] **Step 4: Verify** a 320 y 375 px: nada queda tapado por el dock.

### Task 12: Conductor con texto, desbordes y táctil

**Files:**
- Create: `src/components/monsters/DriverStatus.tsx`
- Modify: `src/app/carrete/tv/page.tsx:276-287`, `src/components/shell/LiveRoomPanel.tsx:219-235`, `src/components/monsters/MonstruometroRanking.tsx:137`, `src/components/shell/AppShell.tsx`, `src/app/globals.css`, los puntos donde se encuentren desbordes

**Interfaces:**
- Produces: `<DriverStatus breach size>`: «Conductor · sin alcohol» o «Conductor tomó · busquen otro», con ícono `Car`.

- [ ] **Step 1:** Reemplazar la barra del conductor por `DriverStatus`.
- [ ] **Step 2:** Enlace «Saltar al contenido» en `AppShell`; regla global de foco visible; objetivos de 44 px.
- [ ] **Step 3: Verify:** sala con nombre sin espacios y `scrollWidth == clientWidth` a 320, 375 y 1440 px en sala, TV, Cuentas y `/armar`, antes con nombres de 30 caracteres y también con datos antiguos largos. `impeccable detect` sin hallazgos nuevos.

### Task 13: Deshacer

**Files:**
- Create: `src/lib/useDeferredDelete.ts`, `src/components/ui/UndoToast.tsx`
- Modify: `src/components/calculators/SplitStudio.tsx:231`, `src/components/calculators/BringList.tsx:73`
- Test: `src/lib/__tests__/deferredDelete.test.ts`

**Interfaces:**
- Produces: `createDeferredDelete(commit: (id: string) => void, delayMs = 5000)` con `schedule(id)`, `undo(id)`, `flush()`, `pending(): Set<string>`.

- [ ] **Step 1: Write the failing tests** (timers falsos): confirma a los 5 s; `undo` lo evita; Review Focus 5: `flush()` confirma lo pendiente.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** y llamar a `flush` al desmontar y en `pagehide`.
- [ ] **Step 4: Run** y **cierre de fase**, con commit si está autorizado.

---

## Fase 4: pantallas antiguas

### Task 14: Borrar lo que no se usa y limpiar movimiento

**Files:**
- Delete: `ConfessionsGame.tsx`, `NeonCard.tsx`, `CarreteCalculator.tsx`, `RandomGameTrigger.tsx`, `SplitBillCountry.tsx`, `WhatsAppShareButton.tsx`
- Modify: todo archivo con `transition-all`; `tv/page.tsx`, `LiveRoomPanel.tsx`
- Test: `src/lib/__tests__/palette.test.ts`

- [ ] **Step 1: Write the failing test:** ningún archivo de `src` contiene `transition-all`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement:** borrar los archivos sin uso (`tsc` confirma) y nombrar propiedades exactas. Barras de la TV y del panel con `scaleX` y origen izquierdo, ≤ 300 ms.
- [ ] **Step 4: Run.** Expected: PASS.

### Task 15: Migración visual, TV e identidad

**Files:**
- Modify: `PiscolometerSlider.tsx`, `EliminationTimeline.tsx`, `app/mitos/page.tsx`, `RandomPicanteGame.tsx`, `SplitBill.tsx`, `tailwind.config.js` (`tv-sm` mínimo `1.5rem`), `tv/page.tsx`, y los usos de `Crown`
- Create: `PRODUCT.md`, `DESIGN.md`

- [ ] **Step 1:** Migrar con `.surface`, `.btn`, `.chip` y `.meta`, sin tarjetas anidadas ni degradados decorativos. El degradado de `CanisterGlassMeter` se conserva.
- [ ] **Step 2:** `Car` en vez de `Crown` y 👑. Texto funcional de TV ≥ 24 px.
- [ ] **Step 3:** Crear `PRODUCT.md` y `DESIGN.md` a partir del código y `docs/paleta-v11.md`.
- [ ] **Step 4: Verify:** `impeccable detect` por ruta, pruebas de paleta en verde y **cierre de fase**, con commit si está autorizado.

---

## Cierre

### Task 16: Revisión y prueba final

- [ ] **Step 1:** `requesting-code-review` sobre toda la rama, con el modelo más capaz. Críticos e importantes con TDD.
- [ ] **Step 2:** Clon limpio de la salida de release en Node 20: portada, TV, OG, POST de sala, `scripts/carrete-concurrency.mjs`, sala tras reinicio.
- [ ] **Step 3:** Reportar lo no verificado (IP real en LiteSpeed, teléfono real, lector de pantalla).
