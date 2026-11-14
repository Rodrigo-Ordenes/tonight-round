# Prompt maestro V12 — Tonight «Señal»

Generado con **prompt-optimizer** a partir del pedido: «analizar, mejorar, usar las skills, instalar nuevas, mejorar el proyecto al 100 %, animaciones mejores y una web más tecnológica; ejecutarlo de forma autónoma».

Proyecto detectado: Next.js 15.5 (App Router) + React 19 + TypeScript + Tailwind 3 + Vitest; producción en V2 Networks (LiteSpeed + Node, rama `v2-release`). Sin `CLAUDE.md`; contexto en `PRODUCT.md`, `DESIGN.md`, `docs/paleta-v11.md`.

## 1. Diagnóstico del pedido

**Fortalezas:** objetivo ambicioso y claro en lo que importa a la persona (que se vea tecnológico y vivo), autoriza instalar herramientas y pide usar todos los recursos.

| Problema | Impacto | Corrección |
| --- | --- | --- |
| «Mejorar al 100 %» no tiene final medible | Trabajo infinito o superficial | Criterios de aceptación por fase y una lista cerrada de críticos de la última auditoría |
| «Más tecnológico» puede caer en clichés (etiquetas en mayúsculas monoespaciadas, brillos, movimiento en todo) | Se ve generado y empeora la usabilidad | Una sola escena memorable + datos en vivo reales; el resto, quieto y preciso (skills `frontend-design` e `impeccable`) |
| Ejecución autónoma sin puntos de control | Riesgo de mezclar cambios o romper producción | Sin commit, push ni publicación sin autorización; fotos del árbol por fase; revisión final por un revisor nuevo |
| «Instalar skills» sin criterio | Herramientas que no se usan | Instalar solo las que cubren huecos reales: E2E (Playwright) y diseño |

**Respuestas que ya da el proyecto:** pila, paleta Brasa, invariantes de reducción de daños, modelo de sala por acciones idempotentes, despliegue por `release:v2`.

## 2. Componentes recomendados

| Tipo | Componente | Para qué |
| --- | --- | --- |
| Proceso | `using-superpowers`, `brainstorming` (pedido ya cerrado: diseño escrito sin ronda de preguntas), `writing-plans`, `executing-plans`, `test-driven-development`, `verification-before-completion` | Plan con interfaces, TDD por tarea, evidencia antes de afirmar |
| Diseño | `frontend-design` (nueva), `impeccable` (`overdrive`, `polish`, `audit`, detector), `emil-design-eng`, `design-taste-frontend` | Una escena memorable sin clichés, piso de calidad medible |
| Movimiento | `animate`, `choreograph`, `animation-performance`, `apple-design`, `review-animations` | Física de scroll suavizada, curvas y duraciones correctas, solo transform/opacity, movimiento reducido |
| Móvil y casos extremos | `mobile-native`, `break-ui` | Horizontal, teclado, nombres largos, 320 px |
| Calidad | `e2e-test-generator` (nueva) + Playwright, `design:accessibility-review`, `security-review`, `react-performance` | Flujo real probado en navegador, accesibilidad y seguridad de enlaces externos |
| Cierre | `verification-loop`, `requesting-code-review` (modelo más capaz), `finishing-a-development-branch` | Build, paquete, revisión y entrega |
| Skills por instalar | `frontend-design`, `e2e-test-generator`, `playwright` (MCP), `Axe Accessibility` (MCP) | Las MCP se activan en una sesión nueva |

## 3. Prompt optimizado — versión completa

```
Eres el equipo de producto y diseño de Tonight (repo tonight-round): Next.js 15.5 App Router, React 19, TypeScript,
Tailwind 3 y Vitest. App gratis y sin cuentas para carretes: un celular por persona y una TV para la sala.
Producción: tonight.misitio.cl (V2 Networks, LiteSpeed + Node). Contexto: PRODUCT.md, DESIGN.md, docs/paleta-v11.md,
docs/despliegue-v2networks.md.

OBJETIVO: una mejora que se note. Tonight debe sentirse como un instrumento vivo de la noche: preciso, en tiempo real
y con UNA escena memorable. «Tecnológico» = responde al instante, muestra datos reales en vivo y tiene física creíble;
NO = brillos, degradados, etiquetas en mayúsculas monoespaciadas ni movimiento por todas partes.

INVARIANTES
- Gratis, sin login, en español; CL por defecto y los 4 países funcionando.
- Alcohol solo educativo; nunca «apto para manejar»; sin castigo ni ranking por consumo; siempre se puede pasar.
- Toda mutación de sala es una CarreteAction idempotente con merge y prueba. Peso y sexo nunca salen del celular.
- Colores solo desde tailwind.config.js; ningún estado solo por color; movimiento con transform/opacity, ≤ 300 ms en UI,
  curva cubic-bezier(0.23, 1, 0.32, 1), y una versión tranquila con prefers-reduced-motion.

FLUJO
1. using-superpowers. Lee el código afectado antes de proponer (cita ruta:línea). Escribe el diseño en
   docs/superpowers/specs/ y el plan en docs/superpowers/plans/ con writing-plans. El pedido ya está decidido: no
   abras ronda de preguntas; registra cada decisión como Ruling en el ledger.
2. Ejecuta con executing-plans y test-driven-development: prueba que falla, implementación, `npm test`.
   Antes de tocar UI: frontend-design + impeccable craft-floor. Movimiento: animate, choreograph, animation-performance.
3. Tras cada fase: `npm test`, `npx tsc --noEmit`, `npm run build`, detector de impeccable en las rutas tocadas y
   una foto del árbol (git write-tree). Sin commit salvo autorización.

FASES
A. Críticos de uso (auditoría anterior): estado de conexión visible en el celular; confirmación y deshacer al sumar
   un trago, con protección contra doble toque; horizontal sin que barra y dock tapen la pantalla; invitar apenas se
   crea la sala (QR, compartir, unirse); «Cambiar de persona» solo para quienes se agregaron en ese celular; aviso de
   precios chilenos fuera de Chile; etiquetas en minúsculas de oración en vez de mayúsculas.
B. Escena memorable — intro del trago 2.0: scroll suavizado (interpolación por cuadro), superficie del líquido con
   ondas, burbujas, chorro, lecturas reales (ml, % de alcohol y gramos calculados), y al terminar la acción de entrar:
   «Crear sala» o «Tengo un código». La red de la portada responde a lo que la persona escribe.
C. Sala en vivo en la TV: la red muestra a las personas reales con su nombre, entra cada nueva persona y viaja una
   señal por cada acción real (trago, agua, voto, canción). Revelado de ronda coreografiado (escalonado + conteo).
D. «Pon tu música»: validar y entender enlaces de Spotify (playlist, álbum, canción, Jam) y YouTube; embed para todos,
   botón para unirse al Jam y QR en la TV; aviso honesto: canciones completas solo con sesión de Spotify en ese
   navegador.
E. Ingeniería: Playwright (crear sala → unirse → ronda → votar → revelar) con e2e-test-generator, CI de GitHub Actions
   (pruebas, tipos, build, E2E) y actualización de documentos.

CRITERIOS DE ACEPTACIÓN
- 0 desbordes a 320, 375 (vertical y horizontal), 1440 y 1920 px; detector sin hallazgos nuevos.
- La intro se puede saltar, no aparece con movimiento reducido ni a quien llega por QR, y no baja de 50 cuadros por
  segundo en un celular de gama media (verificar con el rendimiento del navegador).
- Pruebas de lógica para cada función nueva; E2E verde tres veces seguidas (--repeat-each=3).
- Revisión final por un revisor nuevo; críticos e importantes corregidos con TDD.

NO HACER
- No hacer commit, push, merge, `npm run release:v2` ni cambios en cPanel sin autorización.
- No agregar cuentas, pagos, rastreo ni servicios de pago; no pedir ni guardar credenciales.
- No usar la API de Spotify con login (modo desarrollo limitado a 5 usuarios); no prometer reproducción completa.
- No animar datos en vivo que la persona lee (g/l, montos) ni agregar movimiento sin propósito.
```

## 4. Versión rápida

```
Tonight (Next 15.5/React 19/Vitest). using-superpowers → diseño y plan (sin ronda de preguntas) → executing-plans + TDD.
A: críticos de uso. B: intro del trago 2.0 (scroll suavizado, líquido con ondas, lecturas reales, termina en Crear sala).
C: TV con red viva de personas y eventos reales; revelado coreografiado. D: Pon tu música (Spotify/Jam/YouTube validado).
E: Playwright + CI. frontend-design + impeccable + animate/choreograph; detector, 320–1920 px, E2E ×3, revisión final.
Sin commit, push ni publicación sin autorización.
```

## 5. Por qué estos cambios

| Mejora | Razón |
| --- | --- |
| Definir «tecnológico» en términos de comportamiento | Evita los clichés que `frontend-design` identifica como diseño generado |
| Una escena memorable | «Spend your boldness in one place»: la intro carga la identidad; el resto queda preciso y tranquilo |
| Datos reales en la TV | El movimiento informa (quién llegó, qué pasó) en vez de decorar |
| Críticos de la auditoría primero | Lo vistoso no sirve si el primer minuto confunde o se pierden acciones sin señal |
| Playwright + CI | La V11 mostró que fallos de flujo (rondas sin revelar) no los ven las pruebas unitarias |
| Spotify sin login | Las cuotas de 2026 lo hacen inviable para una app abierta |
