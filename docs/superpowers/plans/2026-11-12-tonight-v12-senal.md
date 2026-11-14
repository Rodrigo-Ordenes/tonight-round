# Tonight V12 «Señal» — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una escena memorable (intro del trago 2.0), datos en vivo reales en la TV, los críticos de uso corregidos, «Pon tu música» y pruebas E2E con CI.

**Architecture:** Lógica pura y probada en `src/lib/*` (física del vaso, eventos de sala, enlaces de música, estado de conexión, invitación, personas del dispositivo). Componentes delgados que la aplican directo al DOM, sin renders por cuadro. La sala sigue el modelo de acciones idempotentes.

**Tech Stack:** Next 15.5, React 19, TypeScript, Tailwind 3, Vitest, Playwright (nuevo, solo desarrollo).

**Spec:** `docs/superpowers/specs/2026-11-12-tonight-v12-senal-design.md`

## Global Constraints

- Sin dependencias nuevas en tiempo de ejecución; Playwright solo como devDependency.
- Movimiento: transform/opacity en HTML (SVG y canvas por atributos), ≤ 300 ms en UI, `cubic-bezier(0.23, 1, 0.32, 1)`, nada con `prefers-reduced-motion`.
- Colores desde `tailwind.config.js` o las variables de `globals.css`.
- Sin commit, push ni `release:v2`. Al cerrar cada fase: `npm test`, `npx tsc --noEmit`, `npm run build` y foto del árbol.

## Review Focus

1. Scroll muy rápido o salto con la tecla Fin en la intro: el vaso llega al estado final sin quedar a medias y la acción final funciona.
2. TV con 0 personas y con 24 o más: la red no se rompe ni se superpone ilegible.
3. Una sala creada con un código de 4 caracteres y la hoja de invitación: QR y enlaces correctos.
4. Enlace de música malicioso (`javascript:`, dominio falso parecido a spotify.com) llega por la API: nunca se incrusta.
5. Celular en horizontal de 320×568: barra rápida y dock no tapan el contenido.

---

## Fase A — críticos de uso

### Task 1: Estado de conexión
**Files:** Create `src/lib/syncStatus.ts`, test `src/lib/__tests__/syncStatus.test.ts`; Modify `src/components/shell/AppShell.tsx` (chip del código).
**Interfaces:** `syncStatus(s: { online: boolean; pending: number }): { tone: "live" | "sending" | "offline"; label: string }`.
- [ ] Test: online sin pendientes → `{tone:"live", label:"En vivo"}`; con 2 pendientes → `sending`, `"Enviando 2"`; sin señal con 3 → `offline`, `"Sin señal, 3 por enviar"`; sin señal sin pendientes → `"Sin señal"`.
- [ ] Implementar y mostrar en el chip con ícono y `aria-live="polite"`.

### Task 2: Confirmar y deshacer el trago
**Files:** Create `src/lib/tapGuard.ts`, test; Modify `src/components/carrete/CarreteClientController.tsx`.
**Interfaces:** `acceptTap(lastAt: number | null, now: number, windowMs = 700): boolean`.
- [ ] Test: primer toque acepta; a 300 ms rechaza; a 700 ms acepta.
- [ ] Toast «Piscola sumada» con «Deshacer» (quita el último trago) durante 4 s.

### Task 3: Horizontal y etiquetas
**Files:** Modify `QuickActionBar.tsx`, `AppShell.tsx` (dock), `globals.css` (`.eyebrow` en minúsculas de oración).
- [ ] Con alto ≤ 480 px la barra rápida se oculta y el dock muestra solo íconos. Verificar en 568×320.

### Task 4: Hoja de invitación
**Files:** Create `src/lib/invite.ts`, test, `src/components/carrete/InviteSheet.tsx`; Modify `CarreteGatewayModal.tsx` (crear → `?invitar=1`), `src/app/carrete/[code]/page.tsx`.
**Interfaces:** `inviteUrl(origin: string, code: string): string` (→ `${origin}/carrete/${code}?modo=celular`), `inviteMessage(code: string, url: string, party: string): string`.
- [ ] Test: URL exacta; mensaje contiene código y URL.
- [ ] Hoja con código, QR, Compartir (si existe `navigator.share`), WhatsApp, Copiar y «Unirme yo también».

### Task 5: Personas de este celular
**Files:** Create `src/lib/myPeople.ts`, test; Modify `CarreteClientController.tsx`, `MonstruometroRanking.tsx`, `SplitStudio.tsx`.
**Interfaces:** `selectablePeople<T extends { id: string }>(people: T[], meId: string | null, mine: string[]): T[]`; `readMine(code)`, `addMine(code, id)` con try/catch.
- [ ] Test: devuelve yo + agregados aquí, en el orden original; vacío si no hay nada.
- [ ] El selector «Cambiar de persona» usa la lista; se oculta si hay una sola.

## Fase B — escena memorable

### Task 6: Física del vaso
**Files:** Create `src/lib/pourPhysics.ts`, test; Modify `src/lib/signalField.ts` (`scrambleFrame` respeta espacios y minúsculas).
**Interfaces:** `approach(current: number, target: number, dtMs: number, halfLifeMs?: number): number`; `surfacePath(left: number, width: number, levelY: number, bottomY: number, t: number, amp: number): string`; `pourReadout(s: { pisco: number; cola: number }): { piscoMl: number; colaMl: number; abv: number; grams: number }` con receta 60 ml de pisco de 35° y 140 ml de bebida.
- [ ] Test: `approach` avanza la mitad tras una vida media y fija al llegar; `surfacePath` sin `NaN` y plana con amplitud 0; trago lleno → 60, 140, 0,105 y 16,8 g; vacío → abv 0.
- [ ] Test: `scrambleFrame("Hielo y pisco", 0.5)` mantiene el espacio y las minúsculas.

### Task 7: Intro 2.0
**Files:** Modify `src/components/gateway/PourIntro.tsx`, `CarreteGatewayModal.tsx`.
- [ ] Bucle por cuadro mientras la intro está a la vista: interpolación, onda según velocidad, burbujas con bebida, hielo que flota, chorro con vaivén.
- [ ] Lecturas reales junto al vaso; etiqueta de paso decodificada.
- [ ] Final: «Crear sala» (misma función del inicio) y «Tengo un código» (baja y enfoca el código).
- [ ] La red de la portada manda señales al escribir el código o crear la sala (`SignalField` acepta `burst: number`).

## Fase C — sala en vivo en la TV

### Task 8: Eventos de sala
**Files:** Create `src/lib/roomEvents.ts`, test.
**Interfaces:** `roomEvents(state: CarreteState, since: number): { key: string; participantId: string; kind: "drink" | "water" | "vote" | "song" | "cheers"; at: number }[]` ordenados por `at`.
- [ ] Test: incluye tragos, agua, votos de la ronda, pedidos y brindis posteriores a `since`; claves estables; excluye anteriores.

### Task 9: Red de personas y revelado
**Files:** Modify `SignalField.tsx` (modo personas: nombres, entrada, señales por evento), `src/app/carrete/tv/page.tsx`, `src/components/live/RoundResults.tsx`.
- [ ] TV en espera muestra la red con nombres; cada evento nuevo viaja una vez.
- [ ] Revelado en TV: barras escalonadas 70 ms y conteo con `CountUp`.

## Fase D — «Pon tu música»

### Task 10: Enlaces de música
**Files:** Create `src/lib/musicLink.ts`, test; Modify `src/lib/music.ts`, `src/lib/carreteState.ts` (validar `customUrl`), `src/lib/securityHeaders.js` (+ `https://www.youtube-nocookie.com`).
**Interfaces:** `parseMusicLink(input: string): { provider: "spotify" | "youtube"; kind: string; embedUrl: string | null; openUrl: string } | null`.
- [ ] Test: playlist con `/intl-es/` y `?si=`; URI `spotify:`; Jam (`spotify.link/…` y `/socialsession/…`) sin embed; YouTube lista y video; rechaza `javascript:`, `http:`, `spotify.com.evil.io`.
- [ ] Test: `SET_MUSIC` con un enlace inválido no guarda `customUrl`.

### Task 11: Interfaz de música
**Files:** Modify `src/app/musica/page.tsx`, `src/components/music/NowPlayingMini.tsx`, `src/app/carrete/tv/page.tsx`.
- [ ] Texto honesto sobre sesión de Spotify; Jam como botón y QR en la TV; YouTube incrustado.

## Fase E — ingeniería

### Task 12: Playwright y CI
**Files:** Create `playwright.config.ts`, `e2e/noche.spec.ts`, `.github/workflows/ci.yml`; Modify `package.json` (`test:e2e`), `.gitignore`.
- [ ] Flujo: crear sala → hoja de invitación → unirse → ronda «Yo nunca» → votar → revelado. Cabeceras de seguridad y `/_next/image` 404. Intro: saltar y llegar al final.
- [ ] `npx playwright test --repeat-each=3` verde.

### Task 13: Documentos y cierre
**Files:** `README.md`, `DESIGN.md`.
- [ ] Documentar la escena, los datos en vivo, la música y cómo correr E2E.
