# Prompt V14 — Apartados inmersivos en primera persona

Pedido del 27 de noviembre de 2026: convertir cada apartado (Sala, Bar, Casino y Música) en un proceso en primera persona guiado por el host, sin perder ninguna función. El trabajo se divide en siete fases (0 a 6), una por sesión, y cada una cierra con todo verde y un reporte. La fase 0 (plan y motor común en `src/components/world/`) quedó registrada en `docs/superpowers/plans/2026-11-27-tonight-v14-inmersivo.md`.

```
Eres el equipo de diseño, 3D y front de Tonight (repo /Users/rodrigo/Downloads/Round, rama tonight-v11): Next.js 15.5
App Router, React 19, TypeScript, Tailwind 3, framer-motion 12, GSAP y Lenis en la portada, three 0.187,
@react-three/fiber 9, drei 10, @react-three/postprocessing 3, Vitest y Playwright con Axe. App gratis y sin cuentas
para carretes: un celular por persona y una TV para la sala. En el árbol hay mucho trabajo SIN commit (V12): no lo
pierdas, no lo reviertas y no cambies de rama.

LEE ANTES DE TOCAR NADA
PRODUCT.md, DESIGN.md, docs/paleta-v12.md y docs/prompt-v13-awwwards.md. Del código: el motor del club
(src/components/gateway/club3d/: flow.ts, ClubScene.tsx con DepthWall, NeonHost, clubAudio.ts), los apartados
(src/components/rooms/: SectionStage, RoomVideo, HostSays, sfx.ts) y las mesas (src/components/casino/: MesaShell,
Wheel3D, BlackjackMesa, RuletaMesa, MaquinaMesa).

OBJETIVO
Cada apartado deja de ser una página con un fondo bonito y pasa a ser un proceso en primera persona guiado por el
host. El mismo patrón en todos: LLEGAR (umbral corto) → MIRAR (cámara a la altura de los ojos; ±25° con arrastre o
giroscopio y vuelta con resorte) → ELEGIR (las opciones son objetos de la escena y el host los señala) → ACERCARSE
(la cámara viaja al objeto en 600–900 ms) → USAR (el objeto se vuelve la herramienta: la herramienta actual aparece
alineada sobre él) → VOLVER (Escape, gesto atrás o botón; el camino inverso).

REGLAS QUE NO SE NEGOCIAN
- Todo en español. Sin commit, push, merge, release:v2 ni cambios en cPanel sin autorización explícita.
- No pierdas funciones: todo el inventario de abajo sigue funcionando, con los mismos nombres accesibles.
- Reducción de daños: siempre hay opción sin alcohol y se puede pasar; nada rojo ni naranjo por tomar.
- Quien maneja nunca ve alcohol, tampoco botellas en la escena.
- Casino solo con puntos; perder nunca obliga a tomar. Sin casi-premios fabricados, sin celebrar como premio lo que
  paga menos que lo apostado, fichas que se reponen gratis, sin rachas ni presión para volver.
- Nada de contraseñas, tokens ni secretos de .env. Nunca «Run NPM Install» en el host. El correo del usuario es
  privado.
- Recursos solo con licencia libre verificada (CC0, Mixkit Free License, Pexels License), anotados en su CREDITOS.md.
  Sin scripts de terceros: respeta la CSP de src/lib/securityHeaders.js.

INVENTARIO QUE DEBE SOBREVIVIR (compruébalo con grep y con las pruebas al empezar y al cerrar)
- /: club 3D (calle → sala → zona) con sus 4 zonas, host neón, sonido del club, giroscopio y última zona recordada;
  la intro «La ronda» se puede saltar y «Ver la ronda» la vuelve a mostrar.
- Navegación: Sala, Bar, Casino y Música; Juegos solo con sala; el MusicDock sigue sonando entre páginas.
- /sala: «Crear sala», «Tengo un código», «Armar la compra»; con sala, «Juegos de la sala» y «La compra y la
  cuenta». /carrete/[code] abre la sala; /sala/[code], /carrete, /grupo y /ronda llevan a la sala activa.
- /armar?ver=compra|cuenta, con «Varios pagaron», «Una boleta» y el cobro por WhatsApp; /dividir lleva a la cuenta.
- /juegos (con sala): todos los juegos de src/lib/partyGames.ts, votar y revelar, la palabra solo en el celular de
  quien actúa y el panel en vivo como cajón. /carrete/tv: la pantalla de la sala.
- /bar?ver=preparar|sinalcohol|recetario|piscolometro|diccionario: «Lo que hay en la mesa», «Sin alcohol»,
  «Recetario», «Piscolómetro» (cambia de nombre según el país) y «Diccionario». El registro de consumo no corre para
  quien maneja, que ve primero lo sin alcohol.
- /casino y /casino/[mesa]: blackjack, ruleta (Wheel3D), frutillita, tragamonedas, tragabar y jackpot; créditos en
  localStorage (tonight_casino_creditos); el casino también se juega dentro de una sala.
- /musica: «Que suene aquí», «Apagar la música», «La fila» (YouTube colaborativa por postMessage), «El DJ sugiere» y
  Spotify.
- Cuidado: /seguridad (Retorno seguro y check-in), /tiempo (¿En cuánto se me pasa?) y /mitos (Mitos y verdades).
  Desde V11 (commit 5be846a) no tenían enlace; la fase 0 comprueba que lo tengan.
- Los locales de src/config/locales (CL, MX, US, JP), las cabeceras de seguridad y el optimizador de imágenes
  apagado.

ARQUITECTURA (nueva carpeta src/components/world/)
- Un Canvas persistente en el layout de cada apartado (por ejemplo src/app/casino/layout.tsx), para que pasar de
  /casino a /casino/blackjack no corte la escena.
- Puntos de vista con nombre (posición, objetivo y fov), movidos con CameraControls de drei (setLookAt y fitToBox
  con transición). El punto de vista se lee y se escribe en ?ver= o en la ruta: los enlaces directos, el botón atrás
  y las pruebas siguen valiendo.
- Escenario mixto: lo que se toca es 3D real modelado en código (barra, mesas, máquinas); lo lejano es la foto real
  con su mapa de profundidad (reusa DepthWall y public/fotos/ambiente/*-depth.webp). Un HDRI CC0 de Poly Haven, solo
  para reflejos.
- Capa DOM paralela: cada objeto tiene un botón real proyectado sobre él, con teclado, lector de pantalla y los
  mismos nombres accesibles de hoy.
- Paso a la herramienta: al llegar, el componente actual se monta sobre el rectángulo del objeto en pantalla y entra
  con un fundido; el foco entra con él y Escape lo devuelve. No uses <Html transform> de drei para esto: cuesta por
  instancia y su oclusión real (occlude="blending") choca con el posproceso.
- El host en la escena (NeonHost o HostNeonSvg; en oro dentro del casino), con HostSays según el punto de vista.
- Sonido desde cada fuente con PannerNode (HRTF) y el oído en la cámara, sobre el contexto compartido de sfx.ts.
- Niveles con PerformanceMonitor: 2 = 3D completo, 1 = foto con profundidad y paralaje, 0 = el SectionStage actual.
  Con movimiento reducido, fundidos en vez de viajes. Ninguna función depende del 3D.

FASES (una por sesión; cada una cierra con todo verde y un reporte)
0. Plan y motor. Guarda este prompt en docs/prompt-v14-inmersivo.md. Usa la skill writing-plans. Haz el inventario
   con grep. Comprueba que /seguridad, /tiempo y /mitos tengan enlace; si no lo tienen, devuélveselo (las dos últimas
   en el bar y Retorno seguro en la sala). Construye world/ (Canvas, puntos de vista, capa DOM, paso a la
   herramienta, niveles) con pruebas unitarias del mapeo entre ?ver= y punto de vista.
1. El bar. Puerta de vaivén; barra en primer plano, contrabarra iluminada y el bar real detrás. El host de cantinero
   pregunta si manejas. Objetos: coctelera = «Lo que hay en la mesa», jarra de limonada = «Sin alcohol», carta =
   «Recetario», vaso con regla = «Piscolómetro», pizarra = «Diccionario», posavasos = Mitos y ¿En cuánto se me pasa?.
   Para quien maneja, la contrabarra muestra jugos, aguas y bebidas.
2. El casino. Cuerda de terciopelo; el piso con mesas y una fila de máquinas. Elegir enciende la lámpara de la mesa;
   sentarse baja la cámara a la altura sentada; en una máquina, la pantalla llena la vista y pasa a ser el juego
   actual. «Levantarse» hace el camino inverso. Wheel3D queda en el piso del casino.
3. Juegos nuevos con la skill test-driven-development: la lógica pura en src/lib, con la prueba primero. Video póker
   (Jacks or Better), baccarat, rueda de la fortuna y sic bo; el blackjack suma dividir y seguro. Cada uno tiene su
   lugar en el piso y su mesa con MesaShell.
4. La sala como vitrina. Salas al estilo de un club privado (La previa, El living, La terraza, El after), cada una
   con su video de fondo y un fundido al pasar. Elegir una crea la sala con ese ambiente; «Tengo invitación» une con
   código; ya dentro hay tres puertas (La compra con la cuenta, Juegos, Música) y /carrete/tv usa el video de la
   sala. Videos de Mixkit con la licencia verificada, en bucle con fundido (ffmpeg), versión -sm y póster webp.
5. Música y mundo sin cortes. La cabina en primera persona: la fila es la caja de vinilos y Spotify, la radio. Las
   luces siguen un tempo propio, porque los iframes no dejan leer el audio. La zambullida del club cae dentro del
   apartado sin pantalla negra; el umbral completo va solo la primera vez de la noche y después dura 300 ms.
6. Transversales e integración. El host con memoria y reloj (agua, comida, cómo volver), la puerta de salida a
   /seguridad, la presencia de la sala, PWA instalable, tacto y modo tranquilo. Cierra con la skill code-review
   sobre todo el trabajo.

PRESUPUESTOS
60 fps en escritorio y 50 o más en un celular de gama media, medidos y no estimados. Ninguna tarea larga de más de
50 ms al tocar. El nivel 0 carga como hoy. Cada escena pesa menos de 3 MB en celular (texturas KTX2, glTF con
meshopt, videos -sm).

VERIFICACIÓN DE CADA FASE
- npx vitest run
- npm run build, y el servidor standalone en el puerto 3105 (copia public y .next/static)
- CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx playwright test --trace=off --workers=1
- Pruebas E2E nuevas para el proceso (llegar, elegir, acercarse, usar, volver) y para quien maneja (cero botellas).
- Fps medidos en escritorio y a 375×812, capturas de ambos y Axe sin violaciones.
- Skills: choreograph y animate para la coreografía, mobile-native para el celular, design:accessibility-review
  para la capa DOM y verification-before-completion antes de decir «listo».

NO HAGAS
- No borres SectionStage ni las vistas actuales: son el nivel 0.
- No cambies rutas, parámetros ?ver= ni los nombres accesibles que usan las pruebas.
- No agregues dependencias de red de terceros ni recursos sin licencia verificada.
- No hagas commit ni despliegues.

AL CERRAR
Resume en español qué cambió, qué verificaste (con números), qué no se pudo verificar y qué sigue. Pide
autorización antes de cualquier commit.
```

## Ajustes posteriores al prompt (27 de noviembre de 2026)

Pedidos del usuario y cambios de la sesión principal que valen para las fases siguientes:

- **Licencias:** además de CC0 y Mixkit, se acepta la Pexels License verificada clip a clip (anotada en CREDITOS.md).
- **Fase 1 (bar):** `public/video/bar.mp4` (+ `-sm` y póster) es ahora la barra completa sin gente, con la contrabarra iluminada y los rojos virados a morado (Pexels 5498710). El cantinero es el host: el fondo del bar no lleva otra persona.
- **Fase 4 (sala):** entrar a la sala es entrar al VIP. Las salas son salones de host club de alto nivel (sillones, lámparas, luz cálida, de noche), no gente brindando. `public/video/sala.mp4` ya es un lounge nocturno sin gente (Pexels 31631562), que también usa /juegos.
- **Fases 1 y 6 (cuidado):** /tiempo, /mitos y /seguridad ya tienen entrada (bar: «¿En cuánto se me pasa?», oculta para quien maneja, y «Mitos y verdades»; sala: «Volver seguro»), pero conservan el diseño viejo: paneles densos, etiquetas rojas o ámbar como «Falso ❌» y un aviso ámbar en /tiempo. Al integrarlas como posavasos (fase 1) y como la puerta de salida (fase 6), llevarlas a la estética del host y a la regla de nada rojo ni naranjo por tomar.
- **SectionStage:** con más de 5 opciones arma dos filas parejas (7 → 4 + 3) y las etiquetas usan `hyphens-auto` y `break-words`.
- **Bar, funciones (pedido del usuario, 27 de noviembre):** «Sin alcohol» pasa a estar dentro del Recetario (para quien maneja, el recetario abre solo en lo sin alcohol). «Lo que hay en la mesa» y el Piscolómetro quedan como están. El Diccionario se agrupa: dentro del Recetario o junto a «Mitos y verdades» (por decidir). «¿En cuánto se me pasa?» queda igual: es importante. Los enlaces `?ver=sinalcohol` y `?ver=diccionario` siguen funcionando y abren su parte dentro del grupo. En la fase 1 esto deja menos objetos en la barra: la carta (Recetario con Sin alcohol y quizás Diccionario) reemplaza a la jarra y a la pizarra.
- **Casino (pedido del usuario, 27 de noviembre, fase 2 y 3):** arreglar el error de la Frutillita y sumar máquinas de casino. Al entrar al casino cambia todo: temática, efectos, colores y sonido; se deja de lado el azul con morado de Tonight y se usa la paleta de casino: rojo, amarillo, dorado y negro (la regla de nada rojo por tomar sigue valiendo para el alcohol; en el casino el rojo es de las mesas y las fichas, nunca de una pérdida ni de un consumo). En el blackjack te sientas a la mesa a jugar; en las máquinas te sientas frente a la máquina y aparece la máquina, con sus efectos. La experiencia es fluida, sin cortes.
- **Música (pedido del usuario, fase 5):** el sonido se mantiene al pasar por la sala, el bar, el casino y la música. En la pista sigue sonando la música del club de la entrada, salvo que la persona ponga la suya. En el casino suena música de casino.
- **Sonido e inmersión (pedido del usuario, fase 5 y todas):** la música del club no se corta y cambia según el lugar: en la barra sigue el sonido del club; en el casino pasa a sonar como casino; en la pista (Música) suena la canción de la entrada y del inicio, salvo que la persona ponga o agregue la suya. Todas las vistas tienen que ser inmersivas y fluidas: la meta es que la gente, cansada después de la semana (en Chile se planea el viernes para relajarse el sábado), se sienta recibida por un host de primer nivel y se lleve un buen rato. Eso sin romper la reducción de daños: la emoción nunca viene de tomar más.
