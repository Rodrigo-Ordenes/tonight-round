# Tonight — Copiloto del Carrete (V11)

Web app gratuita y sin cuentas para armar, jugar y cerrar la noche con tu grupo. Un celular por persona, una TV para la sala y nada que instalar. Chile por defecto; México, EE.UU. y Japón vía `useLocale()`.

## Principios

1. **Cero fricción.** Gratis, sin login ni tiendas de apps.
2. **Chile por defecto.** Piscola 70/30, lucas, CuentaRUT, Ley Emilia y Tolerancia Cero, sin romper los otros tres países.
3. **Reducción de daños, no castigo.** El Monstruómetro es educativo y **nunca** dice "apto para manejar". Los tonos van de turquesa a ámbar; el rojo se reserva para el conductor designado que tomó. No hay ranking por consumo y existe un modo discreto.
4. **Sala sin pérdidas.** Cada cambio es una acción idempotente (`CarreteAction` con `eventId`) que un reductor puro aplica y un merge combina sin perder datos, también sin conexión.
5. **Precios offline.** El catálogo sale de `src/data/prices_cl.json`.

## Qué trae

| Sección | Ruta | Lo principal |
| --- | --- | --- |
| Inicio | `/` | Crear sala (código de 4 letras), unirse por PIN o usar el modo solo |
| Sala | `/carrete/[code]` | Celular: +1 trago, agua, brindis, pedir canción, link de pago. Panel con Monstruómetro, «Yo llevo» y ronda en curso |
| Modo TV | `/carrete/tv?code=` | QR, ronda en vivo con cuenta regresiva, cola de canciones por votos, sorteo de puestos |
| Armar | `/armar` | Canasta por perfil y presupuesto, comparador de tiendas, lista «Yo llevo» (el primero que reclama gana), exportar a WhatsApp |
| Bar | `/bar` | Barra con lo que tienes, ideas, vaso dinámico con % ABV, recetario y diccionario de tragos |
| Juegos | `/juegos` | Rondas en vivo (TV + celulares) con temporizador y revelado automático; La Bomba, ruleta, Yo Nunca, dedo elegido, cambio de puestos |
| Música | `/musica` | DJ con Spotify embebido; pedidos con votos (la cola se ordena sola) |
| Cuentas | `/dividir` | Varios pagadores, quién le debe a quién, botón «Pagar» con link (Mercado Pago, MACH, Venmo, PayPay) |
| Cierre | Wrapped | Resumen de la noche: trago y canción más pedidos, hidratación del grupo, imagen para compartir |
| Info | `/mitos`, `/tiempo` | Mitos con evidencia y línea de tiempo de eliminación |

## Novedades de la V11

- **Paleta «Brasa», basada en un estudio.** Carbón cálido en vez de negro azulado (menos luz azul de noche y sin arrastre OLED), coral como marca, menta para «en vivo», ámbar pisco para avisos y frambuesa solo para el conductor que tomó. Generada en OKLCH y validada con WCAG 2.2, APCA y simulación de daltonismo; detalle en [`docs/paleta-v11.md`](docs/paleta-v11.md). Fuera el tema Halloween, los degradados de texto, los halos y las etiquetas sobre títulos.
- **Rondas que se cierran solas.** Temporizador visible (30 s, 45 s en Impostor), tic en los últimos 10 s y revelado cuando todos votaron o se acabó el tiempo.
- **Más mecánicas de sala:** sorteo de puestos (parejas, tríos, equipos, puestos), lista «Yo llevo», votos a canciones y links de pago por persona.
- **Monstruómetro con criterio:** tonos `bacTone`, sin "Monstruo #1", orden por llegada y modo discreto.
- **Wrapped más rico:** trago de la noche, canción más pedida, % de hidratación y números que cuentan hacia arriba.
- **Motion medido:** entradas de 200–280 ms con `cubic-bezier(0.23, 1, 0.32, 1)`, escalonado solo donde ayuda, nada animado sobre datos en vivo y `prefers-reduced-motion` que suaviza sin apagar.
- **Piso móvil:** inputs de 16 px en pantallas táctiles, sin rebote ni pull-to-refresh, controles que no se seleccionan al mantener presionado y teclado de Android que redimensiona el contenido.
- **Sincronización adaptativa:** sondeo cada 700 ms con una votación abierta, 2 s en reposo, backoff hasta 16 s ante errores y ≥ 8 s con la pestaña oculta.
- **Pruebas:** 97 pruebas con Vitest sobre la lógica pura (reductor y merge, cuentas, juegos, canasta, tonos, sorteo, «Yo llevo», música, Wrapped, sondeo) y sobre la paleta (contraste, regla 500/600 y rampas).

Detalle y fuentes en [`docs/estado-del-arte-v11.md`](docs/estado-del-arte-v11.md), el diseño en [`docs/superpowers/specs/2026-11-06-tonight-v11-design.md`](docs/superpowers/specs/2026-11-06-tonight-v11-design.md) y el plan en [`docs/superpowers/plans/2026-11-06-tonight-v11.md`](docs/superpowers/plans/2026-11-06-tonight-v11.md).

## Internacionalización

Terminología, moneda, leyes y métodos de pago viven en `src/config/locales/` (`cl`, `mx`, `us`, `jp`) y se leen con `useLocale()`.

| | 🇨🇱 Chile | 🇲🇽 México | 🇺🇸 EE.UU. | 🇯🇵 Japón |
| :--- | :--- | :--- | :--- | :--- |
| Fiesta | Carrete | Peda | Party | Nomikai (飲み会) |
| Moneda | CLP / lucas | MXN / varos | USD / bucks | JPY / yenes |
| Límite al volante | 0,30 g/l | 0,40 g/l | 0,08 % BAC | 0,00 mg/l |
| Pago | CuentaRUT / MACH | SPEI / Mercado Pago | Venmo / Zelle | PayPay / LINE Pay |

## Estructura

```
src/
├── app/                 # Rutas (App Router): /, armar, bar, juegos, musica, dividir, carrete/[code], carrete/tv, mitos, tiempo
│   ├── api/carrete/[code]/route.ts   # GET / POST {events|seed} / PUT de la sala
│   └── template.tsx                  # Fundido corto al cambiar de sección
├── components/
│   ├── shell/           # AppShell (navegación, hoja móvil) y LiveRoomPanel
│   ├── live/            # LiveGameHost, RoundTimer, RoundResults, CheersOverlay
│   ├── games/           # GameDeck, SeatShuffle, La Bomba, ruleta, dedo elegido
│   ├── calculators/     # Canasta, presupuesto, BringList, SplitStudio
│   ├── bar/             # BarStudio, Recetario, Diccionario, GlassVisual
│   ├── monsters/        # Monstruómetro
│   └── wrapped/         # TonightWrapped
├── lib/
│   ├── carreteState.ts  # Tipos, acciones, reductor puro y merge con tombstones
│   ├── carreteStore.ts  # Almacén: Redis REST o memoria
│   ├── liveGames.ts     # Rondas, votos y revelado automático
│   ├── split.ts · basket.ts · music.ts · wrapped.ts · shuffle.ts · bacTone.ts · pollDelay.ts
│   └── __tests__/       # Vitest
├── config/locales/      # cl, mx, us, jp
└── data/                # prices_cl.json, drinks.ts, dictionary.ts, games, mitos
```

## Puesta en marcha

Requiere Node.js 18+.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build && npm run start
```

## Publicar en V2 Networks (subdominio)

`npm run release:v2` publica la versión compilada en la rama `v2-release`, y cPanel la clona sin Terminal. Los pasos están en [`docs/despliegue-v2networks.md`](docs/despliegue-v2networks.md).

## Cómo seguir mejorándolo

El flujo recomendado (investigación con NotebookLM, brainstorming, plan, TDD por tarea, detector de diseño de impeccable, verificación en navegador y revisión final) está escrito como prompt listo para pegar en [`docs/prompt-maestro-v11.md`](docs/prompt-maestro-v11.md).

## Almacén persistente de salas (opcional)

Sin configuración, las salas viven en la memoria del servidor: perfecto para desarrollo o un solo proceso. En serverless (Vercel) cada instancia tiene su propia memoria, así que para producción conviene un Redis compartido con capa gratuita. El código habla con Redis por **REST usando `fetch`** (sin SDK ni dependencias nuevas) y funciona con cualquiera de estas dos opciones:

| Opción | Cómo obtener las variables |
| --- | --- |
| **Upstash Redis** (directo) | Crear una base gratuita en [console.upstash.com](https://console.upstash.com) → pestaña *REST API* → copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. |
| **Vercel** (Marketplace → Upstash, ex Vercel KV) | Proyecto en Vercel → *Storage* → *Create Database* → Upstash Redis → conectar al proyecto. Vercel inyecta solas `KV_REST_API_URL` y `KV_REST_API_TOKEN` (y/o las `UPSTASH_REDIS_REST_*`). |

Variables reconocidas (basta un par URL + token; si no hay ninguno, se usa memoria automáticamente):

```bash
# .env.local (no se versiona) o Settings → Environment Variables en Vercel
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
# alternativa equivalente
# KV_REST_API_URL=https://xxxx.upstash.io
# KV_REST_API_TOKEN=xxxx
# opcional: prefijo de llaves (por defecto "tonight:carrete:")
# CARRETE_KEY_PREFIX=tonight:carrete:
```

Cómo funciona (`src/lib/carreteStore.ts`):
- Cada sala son dos llaves con **TTL de 48 h** que se renueva en cada escritura: una foto compactada (`…{CODE}:s`) y un **log append-only** (`…{CODE}:log`).
- `POST {events}`, `{seed}` y `PUT` agregan una entrada al log dentro de un **script Lua** (atómico): las acciones simultáneas desde distintas instancias nunca se pisan. El estado se obtiene plegando el log sobre la foto con las mismas funciones puras del cliente (`applyEvents` / `mergeCarrete` / `normalizeCarrete`).
- Cuando el log supera 24 entradas, quien lo lea lo compacta con un **CAS** (otro script Lua que verifica un token de versión); si dos instancias compiten, una gana y la otra no hace nada.
- Si Redis falla, la API responde `503` y los clientes siguen con su copia local y su cola offline.
- Costo: cada GET/POST es ~1 comando Redis (los GET de polling se cachean 1 s por instancia). Un carrete de 10 celulares durante 5 h usa del orden de 50–90 mil comandos; revisa el límite mensual vigente de la capa gratuita de tu proveedor.

Prueba de concurrencia (40 acciones simultáneas + PUT/seed en paralelo, repartidas entre instancias):

```bash
node scripts/carrete-concurrency.mjs http://localhost:3000
# varias instancias / producción:
node scripts/carrete-concurrency.mjs https://tu-app.vercel.app http://localhost:3000
```

---

## ⚖️ Marco Legal y Responsabilidad

Tonight es una herramienta de entretenimiento, planificación logística y bienestar social.
- **Chile:** Ley N° 20.580 (Tolerancia Cero) y Ley N° 20.770 (Ley Emilia). El límite penal es de 0.30 g/l.
- **México:** Reglamento de Tránsito y sanciones del Centro de Sanciones Administrativas ("El Torito", 0.40 g/l).
- **Estados Unidos:** Leyes estatales de DUI con límite estricto de 0.08% BAC.
- **Japón:** Ley de Tráfico Vial (Tolerancia Cero Absoluta 0.00 mg/l) y responsabilidad penal extendida a acompañantes.

> **Advertencia:** Las estimaciones de alcoholemia son puramente didácticas y aproximadas según modelos farmacocinéticos teóricos. La absorción real varía según el metabolismo individual, ingesta de alimentos, hidratación y factores biológicos. **Si vas a conducir, la única cifra segura de consumo es Cero (0.00). Pasa las llaves o pide un auto de regreso.**
