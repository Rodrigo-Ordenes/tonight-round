# Sistema visual de Tonight

Paleta «Neón»: azul y morado de bar sobre una penumbra violeta. Estudio y validación en `docs/paleta-v12.md`; los valores viven en `tailwind.config.js`.

**Color:** superficies `night-950` a `night-600` (la elevación se marca con luminosidad). azul neón (`indigo`) para marca y acción; morado neón (`purple`) para juegos, destacados y alcoholemia alta; menta (`emerald`, `cyan`) para en vivo, calma y agua; ámbar (`amber`) para avisos; frambuesa (`rose`) solo para el conductor que tomó y acciones destructivas. 500 lleva texto oscuro y 600+ texto blanco; el morado como texto usa 300. Halo de neón (`.neon-blue`, `.neon-violet`, `shadow-neon`) solo en el logo, la palabra de acento, la acción principal y el código de sala. Ningún estado se comunica solo con color.

**Tipografía:** Archivo con ancho 106 (títulos), Manrope (texto), JetBrains Mono (cifras), Doto (código de sala y cifras grandes de la TV, como letrero LED). Mínimo 12 px; en la TV, 24 px.

**Componentes:** `.surface`, `.btn-primary`, `.btn-ghost`, `.chip`, `.meta`, `.eyebrow`. `Modal` sobre `<dialog>` para todo diálogo. `DriverStatus` para el conductor. Radios de hasta 16 px, sin tarjetas anidadas ni sombras de color. Objetivos táctiles de 44 px.

**Movimiento:** entradas de 200–280 ms con `cubic-bezier(0.23, 1, 0.32, 1)`. Solo `transform` y `opacity`; nunca `transition-all`. Datos en vivo sin animación decorativa.

**Móvil:** barra rápida sobre el dock, safe areas, inputs de 16 px en táctil y sin desborde a 320 px.
