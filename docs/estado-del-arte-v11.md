# Tonight V11 — Estado del arte de apps sociales de carrete (2025–2026)

Investigación profunda hecha con NotebookLM (cuaderno **"Tonight V11 — Estudio del arte y mejoras"**, 46 fuentes encontradas, 37 importadas) y contrastada con una auditoría de diseño del código (impeccable) el 6 de noviembre de 2026. Este documento resume qué hacen mejor los líderes de cada vertical y qué adopta Tonight.

## 1. Lo que define a los mejores

| Vertical | Líder | Mecánica estrella | Estado en Tonight V10 | Qué adopta la V11 |
| --- | --- | --- | --- | --- |
| Invitación y comunidad | Partiful | Página de evento sin descarga ni cuenta; lista de "qué llevar"; álbum post-evento; links de pago (Venmo/CashApp) | Sala con código de 4 letras, QR, vista previa al compartir | **Lista "Yo llevo"** sincronizada y **link de pago** por persona. Álbum de fotos: pendiente (requiere almacenamiento) |
| Juegos de segunda pantalla | Jackbox, Kahoot | TV como escenario, celular como control privado; ritmo con audio que se acelera al final; información asimétrica | 6 juegos en vivo con votos secretos, El Impostor, revelación con confeti | **Cuenta regresiva** por ronda con tic creciente y **auto-revelar** cuando votan todos; botones de voto grandes y codificados por color |
| Música compartida | Spotify Jam | Cola compartida con atribución y recomendaciones por compatibilidad del grupo | DJ automático por hora/país/ritmo; pedidos de canciones | **Votos a los pedidos** (la cola se ordena por la sala) |
| Coctelería | Mixel, Difford's Guide | "Lo puedes preparar ahora"; Maximizer: la botella que más recetas desbloquea | Barra/ideas/vaso; "si compran una sola cosa más" | Maximizer con **precio** y recetas desbloqueadas visibles |
| Cuentas | Splitwise, Tricount | Simplificación de deudas; pago directo con la infraestructura local (SPEI, Mercado Pago) | Multi-pagador, 3 modos, transferencias mínimas | **Link de pago** por persona (Mercado Pago, MACH, Venmo, PayPay…) en cada transferencia |
| Alcohol y reducción de daños | AlcoTrack, Alcohol Tracker | Lenguaje no punitivo; colores suaves (teal → ámbar) en vez de alarmas; línea de tiempo a 0.00; refuerzo positivo del agua; **modo discreto** | Widmark dinámico, escudo de agua, recordatorios, castigos sin alcohol | **Paleta empática** (sin rojo salvo conductor que tomó), **sin premiar al que más toma**, **modo discreto** en el celular |
| Nomikai (Japón) | Sekigae.app | Rotación de puestos automática y neutral proyectada en pantalla | — | **Rotación de puestos y equipos** animada en la TV |
| Viralidad | Partiful, Spotify Wrapped | Coeficiente K = invitaciones × conversión; tarjetas 9:16 para historias | Wrapped con premios y tarjeta 1080×1920 | Wrapped con **canción más pedida**, **trago más preparado** e **hidratación del grupo** |

## 2. Hallazgos técnicos

- **Tiempo real:** los líderes usan WebSockets (Jackbox, Kahoot) o actores de borde con estado (PartyKit / Cloudflare Durable Objects). Tonight usa acciones delta idempotentes con polling; para salas de ~10 personas es suficiente, pero las votaciones se sienten mejor con menor latencia. **V11:** polling adaptativo (más rápido con una ronda abierta). WebSockets/PartyKit queda como evolución si la app crece (ver decisión en el documento de diseño).
- **CRDT:** el modelo de Tonight (logs por id con tombstones, votos por participante, LWW por campo) ya es convergente para los casos de la sala sin necesidad de Yjs.
- **Móvil web:** `touch-action: manipulation`, objetivos táctiles grandes, señales de audio acompañadas de señales visuales (accesibilidad) y degradar medios cuando la red es mala.
- **Monetización sin muros:** los invitados nunca pagan; solo se monetizan extras del anfitrión. Tonight se mantiene 100% gratis.

## 3. Brechas de diseño encontradas en la auditoría (impeccable)

- Huellas de "UI hecha por IA": texto con degradado, halos radiales, brillos de color en botones, degradados violeta, etiqueta mono sobre cada título.
- Contraste: gris chico 3,6:1 (requiere 4,5:1); blanco sobre coral 3,8:1.
- Texto funcional de 10–11 px; campos de 14 px que provocan zoom en iOS.
- Saltos de jerarquía (h1 → h3), tarjetas dentro de tarjetas, rebotes genéricos (`animate-bounce`).
- Tema Halloween obsoleto.

## 4. Fuentes principales (en el cuaderno)

Partiful (App Store, Google Play, Software Mansion, IXD@Pratt), Spotify Jam (Spotify Support), Mixel (sitio, App Store, Google Play, DesignRush), Difford's Guide (Cocktail Finder), AlcoTrack (Garmin Connect IQ), Alcohol Tracker App, Kahoot!, Sekigae.app, Splitwise, PartyKit (docs, GitHub, adquisición por Cloudflare), Liveblocks vs PartyKit 2026, Cloudflare Workers WebSockets, Pusher (latencia en juegos), DEV Community (backend de 3.000 usuarios), Reddit r/gamedev (conexión Jackbox).
