# Sistema visual de Tonight

Paleta «Brasa». Estudio y validación en `docs/paleta-v11.md`; los valores viven en `tailwind.config.js`.

**Color:** superficies `night-950` a `night-600` (la elevación se marca con luminosidad). Brasa (`indigo`) para marca y acción; menta (`emerald`) para en vivo y calma; ámbar (`amber`) para avisos; frambuesa (`rose`) solo para el conductor que tomó y acciones destructivas; iris (`purple`) para juegos; agua (`cyan`). 500 lleva texto oscuro y 600+ texto blanco. Ningún estado se comunica solo con color.

**Tipografía:** Bricolage Grotesque (títulos), Manrope (texto), JetBrains Mono (cifras). Mínimo 12 px; en la TV, 24 px.

**Componentes:** `.surface`, `.btn-primary`, `.btn-ghost`, `.chip`, `.meta`, `.eyebrow`. `Modal` sobre `<dialog>` para todo diálogo. `DriverStatus` para el conductor. Radios de hasta 16 px, sin tarjetas anidadas ni sombras de color. Objetivos táctiles de 44 px.

**Movimiento:** entradas de 200–280 ms con `cubic-bezier(0.23, 1, 0.32, 1)`. Solo `transform` y `opacity`; nunca `transition-all`. Datos en vivo sin animación decorativa.

**Móvil:** barra rápida sobre el dock, safe areas, inputs de 16 px en táctil y sin desborde a 320 px.
