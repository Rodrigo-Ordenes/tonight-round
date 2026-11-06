# Tonight V11 — Diseño

Aprobado por el usuario el 2026-11-06 ("cambia todo lo que sea necesario… ya no me sirven los colores de Halloween").

## Intención

Llevar Tonight de "muy completo" a "hecho con criterio": que no parezca una UI genérica hecha por IA, que se sienta nativo en el celular y en la TV, y que adopte las mecánicas de los líderes (Jackbox, Kahoot, Partiful, Spotify Jam, Mixel, Splitwise, Sekigae, AlcoTrack) que la investigación mostró que faltan. Ver `docs/estado-del-arte-v11.md`.

## Metas

1. **Identidad visual propia** sin huellas de IA: acentos sólidos (sin texto degradado), sin halos radiales ni brillos de color, etiquetas solo cuando dan información, colores por ambiente en un solo tono.
2. **Legibilidad y acceso:** contraste ≥ 4,5:1 en texto, piso de 12 px para texto funcional, campos de 16 px en móvil, jerarquía de títulos correcta, foco visible.
3. **Reducción de daños empática:** paleta teal → ámbar en alcoholemia; rojo solo para el conductor que tomó; no se premia a quien más toma; modo discreto en el celular.
4. **Motion con propósito:** entrada de cada sección, entradas escalonadas en grillas, números que se animan al cambiar, respuesta al tocar; con alternativa real en `prefers-reduced-motion` (sin apagar la retroalimentación útil).
5. **Mecánicas nuevas:** cuenta regresiva y auto-revelar en rondas en vivo; rotación de puestos/equipos en la TV; lista "Yo llevo"; link de pago por persona; votos a pedidos de canciones; Wrapped con canción y trago top e hidratación; polling adaptativo.
6. **Calidad de sistema:** pruebas automáticas de la lógica pura (reductor, cuentas, juegos, canasta), detector de diseño limpio, build sin errores.
7. **Documentación:** estado del arte, este diseño, prompt maestro V11 y README al día.

## No metas

- Álbum de fotos compartido (requiere almacenamiento de archivos de pago o externo).
- Migrar a WebSockets/PartyKit (cambio de infraestructura; queda como decisión futura).
- Traducir la interfaz a otros idiomas.
- Rediseñar desde cero la arquitectura de navegación (el shell multi-escritorio se mantiene).

## Anti-metas

- Que la app se vea más "decorada" pero menos clara.
- Que cualquier pantalla diga o insinúe que alguien está "apto para manejar".
- Que la animación retrase acciones frecuentes (registrar trago, votar).

## Restricciones

- Gratis, sin login, sin dependencias pesadas en runtime (solo `vitest` como dependencia de desarrollo para pruebas).
- Next.js 14 + React 18 (sin `<ViewTransition>` de React 19: la transición de ruta se hace con `template.tsx` y CSS).
- Mantener la identidad chilena por defecto y los 4 países.

## Enfoques considerados

1. **Pulido local por pantalla** (solo corregir lo que marca el detector). Barato, pero deja la inconsistencia de sistema.
2. **Reforma de sistema + mecánicas nuevas (elegido):** corregir tokens y utilidades globales (`tailwind.config.js`, `globals.css`, `PageHeader`) para que el cambio se propague, rehacer las piezas con más deuda (Monstruómetro, Música, Armar) y sumar las mecánicas de la investigación.
3. **Rediseño total con nuevo mundo visual.** Descartado: el shell y la paleta base funcionan; el problema son los adornos y el detalle.

## Decisiones de diseño

- **Acento:** coral `ember` sólido para el punto final de los títulos y códigos de sala.
- **Fondo:** se quitan las auroras radiales; queda el grano fino y una luz superior plana muy tenue (sin halo).
- **Sombras:** `shadow-glow*` pasan a sombras neutras de elevación.
- **Grises:** `slate-500` sube a ≈ #8E879D (≥ 4,5:1 sobre fondo).
- **Coral 600:** se oscurece para que el texto blanco pase 4,5:1.
- **Etiquetas (`eyebrow`):** 12 px; se mantienen solo con información (hora, sala, paso n.º).
- **Alcoholemia:** 0 → teal (`cyan`), 0,3 → ámbar, ≥ 0,8 → ámbar intenso; rojo solo para conductor con alcohol.
- **Halloween:** se elimina el tema (`useTheme`, ramas `halloween`).

## Lo que queda a criterio del implementador

Duraciones y curvas exactas de motion (dentro de 150–400 ms, ease-out), textos de microcopy, ubicación fina de los nuevos controles.
