# Prompt V13 — Tonight a nivel Awwwards

Pedido: llevar la propuesta visual al nivel de los sitios de [30 webs con efecto parallax (Awwwards)](https://www.awwwards.com/30-webs-con-efecto-parallax.html), partiendo por la portada, elevando lo que existe, sin perder funciones y mejorando todas las vistas y el fondo.

```
Eres el equipo de diseño y front de Tonight (repo /Users/rodrigo/Downloads/Round, rama tonight-v11): Next.js 15.5 App
Router, React 19, TypeScript, Tailwind 3, Vitest y Playwright. App gratis y sin cuentas para carretes: un celular por
persona y una TV para la sala. El trabajo V12 está en el árbol SIN commit; no lo pierdas.
Lee antes de tocar nada: PRODUCT.md, DESIGN.md, docs/paleta-v12.md, docs/prompt-continuar-v12.md y la referencia
https://www.awwwards.com/30-webs-con-efecto-parallax.html (mírala en el navegador, no solo el texto).

OBJETIVO
Que Tonight se sienta como un sitio premiado: scroll con inercia, escenas que cuentan la noche, profundidad real y un
fondo vivo, pero que siga siendo la misma herramienta rápida para usar con un trago en la mano. Se eleva lo que hay;
no se reemplaza ni se borra ninguna función.

IDENTIDAD QUE SE MANTIENE
Paleta «Neón» (azul y morado de bar sobre penumbra, menta para lo en vivo), logo de brindis siempre eléctrico,
Archivo + Manrope + Doto (LED para el código de sala), intro «La ronda», red viva de la sala, menú con píldora.

SKILLS (cárgalas en este orden y úsalas de verdad, citando qué decisión sale de cada una)
1. Dirección: frontend-design, design-taste-frontend, impeccable (critique, overdrive, polish, audit y su detector),
   design:design-critique, emil-design-eng.
2. Movimiento: animate, choreograph, apple-design, gsap-scroll-trigger, gsap-timelines, gsap-text, gsap-react,
   gsap-performance, css-animations, ui-motion, animation-performance, find-animation-opportunities,
   improve-animations y review-animations al cierre.
3. Superficie y detalle: ui-surfaces, ui-typography, ui-interactions, tailwind, mobile-native, break-ui.
4. Ingeniería: nextjs-routing, react-performance, performance, karpathy-guidelines (cambios mínimos en lo que ya
   funciona), type-safety.
5. Calidad: e2e-test-generator, MCP de Playwright, axe-accessibility (mcp-audit) y design:accessibility-review,
   verification-before-completion, requesting-code-review con un revisor nuevo, unslop y humanizer para todo texto.
6. Agentes: hzblj-skills:animation-specialist para escenas GSAP difíciles, hzblj-skills:web-developer para piezas
   de página, hzblj-skills:clean-code-reviewer antes de cerrar.

DEPENDENCIAS AUTORIZADAS
GSAP (core, ScrollTrigger, SplitText) y Lenis, con import dinámico: solo cargan donde hay escenas (portada y, si
suma, la TV). Mide el peso antes y después en el build y repórtalo. Todo lo demás, sin dependencias nuevas.

FASE 1 — PORTADA (la vitrina)
- Scroll suavizado con Lenis sincronizado con ScrollTrigger (scrub numérico); desactivado con movimiento reducido y
  en pantallas táctiles si empeora el gesto nativo (decide con prueba en 375 px).
- Intro «La ronda»: mantener toda su lógica y pruebas (src/lib/introScene.ts); sumar profundidad (primer plano,
  vasos, fondo) y transición fluida hacia el hero en vez de corte.
- Hero como escena: red, retícula, título y logo eléctrico en 4 profundidades; en escritorio siguen el puntero con
  resorte suave. El título entra con SplitText por palabras (accesible: el texto real queda en el DOM).
- «De la previa al cierre»: recorrido horizontal fijado por los 5 módulos (Armar, Bar, Juegos, Música, Cuentas)
  como la línea de tiempo de la noche, cada uno con su ilustración neón y su CTA; en celular, versión vertical
  sin pin (gsap.matchMedia).
- Color de la noche: el fondo pasa de azul a morado según el avance, con elementos flotantes (hielo, burbujas,
  chispas) a varias profundidades.
- El panel de crear sala y entrar con código sigue siendo lo primero que se alcanza con un toque.

FASE 2 — FONDO DE TODA LA APP
Un fondo vivo y común (penumbra, retícula, halos neón muy suaves que derivan y reaccionan al scroll) que reemplace
las capas sueltas actuales sin bajar el contraste del texto (APCA ≥ 60 sobre él). Barato: canvas o CSS en el
compositor, se pausa fuera de pantalla y en segundo plano.

FASE 3 — TODAS LAS VISTAS (elevar sin perder nada)
Bar, Armar, Juegos, Música, Cuentas, sala (mesa y celular), TV, invitación y Wrapped:
- Encabezados con revelado por palabras y parallax leve; tarjetas con profundidad (ui-surfaces) y entrada en ola.
- Juegos: cada juego con su viñeta animada; la ruleta y la bomba con física creíble.
- Celular en sala: más energía sin tocar las cifras de alcohol (no se animan); retroalimentación al sumar.
- TV: transiciones de ronda como escenas (entrada, votación, revelado) pensadas para verse a 3 metros.
- Antes de cambiar una vista, lista sus funciones y verifícalas después: ninguna se pierde.

CRITERIOS DE ACEPTACIÓN
- 60 cps en celular de gama media y escritorio en la portada (mide con el navegador, sin dibujo por software).
- 0 desbordes en 320, 375, 568×320, 1440 y 1920; capturas antes y después de cada vista.
- Movimiento reducido: todo legible y usable sin animación; teclado completo; Axe sin violaciones nuevas.
- npm test, npx tsc --noEmit, npm run build y npm run test:e2e -- --repeat-each=3 en verde; E2E nuevo para la
  portada (scroll completo y CTA alcanzable) y para no perder funciones de cada vista.
- Revisión final por un revisor nuevo; críticos e importantes corregidos con prueba primero.

REGLAS
- Español. Sin commit, push, merge, release:v2 ni cambios en cPanel sin autorización.
- Reducción de daños intacta: siempre opción sin alcohol, el conductor nunca ve alcohol, nada rojo ni naranjo por
  tomar, ninguna cifra de alcohol o monto animada.
- Solo transform y opacity en lo que corre por cuadro (halos y filtros solo puntuales); nada de transition-all.
- Colores solo desde tailwind.config.js y las variables de globals.css.
- Hooks siempre antes de cualquier return temprano (ya rompió la vista del celular una vez).
- npm run build y el servidor de desarrollo comparten .next: no los corras a la vez.

ENTREGA
Informe con capturas antes y después por vista, peso agregado al build, cuadros por segundo medidos, decisiones
tomadas por skill y lo que quedó pendiente. Luego pregúntame por el commit.
```
