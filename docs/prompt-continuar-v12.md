# Prompt para continuar la V12 en una sesión nueva

```
Seguimos con Tonight (repo /Users/rodrigo/Downloads/Round, rama tonight-v11). Todo el trabajo de la V12 está en el
árbol de trabajo SIN commit. Lee primero docs/paleta-v12.md, DESIGN.md y docs/superpowers/plans/2026-11-12-tonight-v12-senal.md.

USA ESTAS SKILLS (recién instaladas, por eso reiniciamos):
- Del paquete «Skills For Real React/React Native Engineers»: gsap-scroll-trigger, gsap-performance, gsap-react,
  css-animations, ui-motion, ui-interactions, ui-surfaces.
- frontend-design, e2e-test-generator y karpathy-guidelines (cambios mínimos cuando pido algo directo).
- MCP de Playwright y Axe Accessibility para verificar en navegador y auditar accesibilidad.

ESTADO
- Hecho y en verde (270 pruebas, tipos y build): paleta «Neón» (azul y morado de bar), títulos en Archivo y código de
  sala en Doto (LED), intro «La ronda» con logo eléctrico, capa de movimiento (menú con píldora deslizante, cascada por
  página, tarjetas que aparecen al bajar, letreros que se encienden), logo intermitente como cartel de neón, parallax
  con animaciones CSS ligadas al scroll (clases parallax-deep/mid/near/float en globals.css), vista del celular con red
  viva y colores de marca, TV con red de personas y eventos reales y revelado escalonado, «Pon tu música» (Spotify,
  Jam con QR en la TV, YouTube sin cookies, validado en reductor y normalización), 4 juegos nuevos (Duelo, Mímica,
  Verdad o reto, Cultura chupística), bancos de preguntas más grandes y alternativas a los retos (reto, sorbo, shot
  chico, agua, verdad o pasar; el conductor y quien va alto nunca ven alcohol), Playwright + CI.
- E2E: 39/39 tres veces seguidas ANTES del último lote (logo, intro, celular, parallax, juegos). Hay que repetirlo.
- Sin verificar en pantalla: logo eléctrico de la intro, parpadeo del logo, vista del celular, parallax, Mímica (la
  palabra solo en el celular de quien actúa), alternativas en Ruleta y La Bomba, QR del Jam en la TV, video de YouTube.

TAREAS
1. Con gsap-scroll-trigger y gsap-performance, revisa el parallax: decide con evidencia entre mantener CSS ligado al
   scroll (sin dependencias; Firefox no lo soporta y queda quieto) o GSAP ScrollTrigger (agrega peso). Extiéndelo a
   otras páginas solo si suma.
2. Con css-animations y ui-motion, pule los letreros de neón (.neon-sign, .neon-electric) y el dinamismo de la vista
   del celular (CarreteClientController); con ui-interactions, el toque de los botones principales.
3. Verifica con el MCP de Playwright en 320, 375, 568×320, 1440 y 1920: portada e intro, celular en sala, TV y los
   juegos nuevos. Audita con Axe las pantallas nuevas.
4. Corre npm test, npx tsc --noEmit, npm run build y npm run test:e2e -- --repeat-each=3. Agrega un E2E de Mímica
   (la palabra solo aparece en el celular de quien actúa).
5. Revisión final con un revisor nuevo; corrige críticos e importantes con prueba primero. Informe y pregúntame por
   el commit.

REGLAS
- Español. Sin commit, push, merge, release:v2 ni cambios en cPanel sin que lo autorice.
- Reducción de daños: siempre hay opción sin alcohol y se puede pasar; nada rojo ni naranjo por tomar.
- Movimiento solo con transform y opacity (salvo halos puntuales), nada con prefers-reduced-motion, y las cifras de
  alcohol y montos no se animan.
- Paleta y tokens según docs/paleta-v12.md. Sin dependencias nuevas en tiempo de ejecución salvo que se justifiquen.

NOTAS TÉCNICAS
- npm run build y el servidor de desarrollo comparten .next: no los corras a la vez.
- Si Playwright no abre Chromium, reinstálalo (npx playwright install chromium) o usa
  CHROME_BIN=$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell
- Si el panel del navegador está oculto, no corren los cuadros de animación (requestAnimationFrame se pausa).
```
