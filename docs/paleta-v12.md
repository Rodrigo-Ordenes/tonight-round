# Paleta V12 — «Neón»

Pedido del 12 de noviembre de 2026: sacar el naranjo, que la web se vea más tecnológica y, después, «un neón azul y un morado neón como colores predominantes, tipo bar». La fuente de verdad sigue siendo `tailwind.config.js`; este documento explica el porqué y cómo se validó. Reemplaza a «Brasa» (`docs/paleta-v11.md`).

## La idea

Un bar de noche: penumbra, letreros de neón azul y morado, y una tira de luz bajo la barra. El neón vive en piezas chicas (la acción principal, la palabra de acento, el logo, las líneas de la red y de la intro) y brilla como un tubo real: centro casi blanco y el color intenso en el halo. Las superficies quedan casi negras para que el neón mande.

## Qué cambió y por qué

| Antes («Brasa») | Ahora («Neón») | Razón |
| --- | --- | --- |
| Carbón cálido `#0D0907` | Penumbra `#090A0D` (tono 282, croma ≤ 0,014) | Casi negro con un tinte violeta apenas perceptible: el ambiente de un bar, sin #000 (arrastre en OLED). |
| Marca coral `#FF8346` | **Azul neón** `#67AAFF` | Pedido explícito. Es el color de la acción: botones principales, foco, progreso y enlaces. |
| Iris `#BFAAFF` (juegos) | **Morado neón** `#B93EF3` | Segundo dominante: juegos, destacados, la palabra de acento y la alcoholemia alta. |
| Menta `#59D2B1` y agua `#95D1FF` | **Menta** `#8CE3BE`, un solo tono | Lo que está en vivo, la calma y el agua comparten color (el agua siempre con su gota). Un tono menos deja más distancia entre los demás. |
| Terracota para la alcoholemia alta | **Morado neón** | Sin naranjo ni rojo: la escala queda menta → ámbar → morado, intensa y sin regaño. |
| Ámbar `#FFD375` | Ámbar `#E4B853` | Más profundo para separarse del azul; su tono no baja de 84 para no volverse naranjo. |
| Frambuesa `#FD4576` | Frambuesa `#FA4C6D` | El peligro (solo el conductor que tomó y las acciones destructivas) se sigue leyendo como tal. |

## El estudio

- **Neón en sRGB.** El azul no puede ser claro y saturado a la vez en una pantalla. Una primera búsqueda que exigía texto oscuro sobre el 500 entregó un azul y un morado pastel (`#81ADFF`, `#D3BCFF`), que no se leen como neón. La solución es la de un letrero real: el tono intenso va en líneas, texto grande y halos sobre el fondo oscuro, y el texto de lectura usa la versión clara del mismo tono.
- **Fisiología, con honestidad.** La melanopsina, que regula la melatonina, es más sensible cerca de 490 nm (norma CIE S 026); el azul neón queda cerca. Por eso el azul y el morado ocupan poca área, las superficies son casi negras y el texto largo va en blanco roto. El estudio anterior evaluó un acento volt, verde amarillo junto al máximo de sensibilidad del ojo (555 nm); quedó descartado por la identidad de bar que se pidió.
- **Tendencia.** En las guías de 2026 el modo oscuro es la base y los acentos neón se usan con mesura, en botones principales, anillos de foco y etiquetas, idealmente bajo el 10 % de la pantalla.
- **Accesibilidad.** Se exigen WCAG 2.2 (4,5:1) y APCA a la vez. La distinción entre estados se mide como ΔE en OKLab con visión normal, protanopía, deuteranopía y tritanopía (Machado 2009). El par delicado es azul contra morado: con protanopía el morado pierde el rojo y se ve azul, así que los dos se separan por luminosidad.
- **Lo que se descartó.** Degradados morado-azul de fondo (la huella más común de la interfaz generada), halos en todas partes y el negro puro.

Fuentes: [CIE S 026, tutorial](https://files.cie.co.at/CIE_S_026_Tutorial2021_information.pdf) · [Melanopsina y filtrado del cristalino (PMC8095192)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8095192) · [Espectro melanópico y V(λ) (PMC8929548)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8929548) · [Tendencias de dashboards 2026](https://dev.to/thekitbase/saas-dashboard-design-trends-in-2026-with-examples-121m) · [Tendencias de color UI 2026](https://updivision.com/blog/post/ui-color-trends-to-watch-in-2026) · [Robinhood, identidad 2024 (referente del acento volt evaluado)](https://robinhood.com/newsroom/a-new-visual-identity)

## Roles

| Rol | Escala (alias en código) | 300 | 400 | 500 | 600 |
| --- | --- | --- | --- | --- | --- |
| Superficies | `night` | — | — | — | 950 `#090A0D` |
| Texto | `ink` (`slate`, `gray`) | `#BCBDC4` | `#B4B5BD` | `#A0A1A9` | `#6A6B73` |
| Marca y acción — Azul neón | `neon` (`indigo`, `blue`) | `#A9CFFF` | `#89BDFF` | `#67AAFF` | `#006ED5` |
| Juegos, destacados y alcoholemia alta — Morado neón | `uv` (`purple`, `violet`, `fuchsia`) | `#D793FF` | `#CA68FF` | `#B93EF3` | `#981BCD` |
| En vivo, calma y agua — Menta | `signal` (`emerald`, `green`, `teal`, `cyan`, `sky`, `lime`) | `#B7F6D9` | `#9EEECB` | `#8CE3BE` | `#2D8162` |
| Aviso — Ámbar | `amber` (`yellow`, `orange`) | `#EFCB7D` | `#E4B853` | `#D5A62E` | `#8D6A00` |
| Peligro — Frambuesa | `flare` (`rose`, `red`, `pink`) | `#FFA0A8` | `#FF798A` | `#FA4C6D` | `#C9214B` |

Superficies: `night-950 #090A0D` (fondo), `900 #131318` (tarjeta), `850 #1B1B21`, `800 #23232A` (elevada), `700 #2F3037`, `600 #3E3F47`. En CSS: `--blue`, `--violet`, `--signal`, `--amber`, `--flare` (y `--blue-text`, `--violet-text` para texto) y, solo para ilustrar tragos, `--beer`, `--cola`, `--wine`, `--citrus`.

### Reglas

1. **Azul 500 lleva texto oscuro** (8,3:1, APCA 57): el botón principal es un letrero encendido. **600+ lleva texto blanco** en todas las escalas.
2. **El morado como texto usa 300** (el centro del tubo, APCA 58); el 400–500 va en halos, líneas, íconos y rellenos. Los botones morados usan 600 con texto blanco.
3. **Halo de neón solo en**: el logo, la palabra de acento (`.neon-violet`, `.neon-blue`), la acción principal (`shadow-neon`), el código de sala y las piezas de la intro (la tira de la barra y la tele). Si todo brilla, nada brilla.
4. **Alcoholemia: menta (0,00) → ámbar (sube) → morado (alta).** Nunca rojo ni naranjo por tomar; la frambuesa queda solo para el conductor que tomó.
5. **Ningún estado depende solo del color**: siempre hay texto, ícono o cifra.

## Validación

Generada con `scripts/palette/gen.mjs` desde `scripts/palette/neon.json`, explorada con `scripts/palette/optimize-neon.mjs` y validada con `scripts/palette/palette.mjs`. Informe completo: `scripts/palette/report-neon.txt`.

| Par | WCAG | APCA Lc |
| --- | --- | --- |
| Texto principal sobre fondo | 16,8:1 | 96 |
| Texto oscuro sobre el botón azul (`indigo-500`) | 8,3:1 | 57 |
| Texto blanco sobre `indigo-600` | 5,0:1 | 79 |
| Texto blanco sobre `purple-600` | 6,2:1 | 85 |
| Azul como texto (`indigo-400`) sobre tarjeta | 9,5:1 | 64 |
| Morado como texto (`purple-300`) sobre tarjeta | 8,4:1 | 58 |

**Distinción con daltonismo (ΔE OKLab, peor caso entre visión normal y los tres daltonismos):**

| Par de estados | Brasa (V11) | Neón (V12) |
| --- | --- | --- |
| Marca vs peligro | 10 | 21 |
| Marca vs aviso | 9 | 20 |
| En vivo vs aviso | 10 | 13 |
| En vivo vs peligro | 11 | 21 |
| Aviso vs peligro | 22 | 14 |
| Azul vs morado (los dos dominantes) | — | 12 |
| En vivo vs alcoholemia alta | — | 27 |
| En vivo vs marca | — | 11 (tritanopía, ~0,01 % de la población) |

El peor par de la V11 era 6 (agua contra en vivo); ahora es 11. Las pruebas de `src/lib/__tests__/palette.test.ts` leen `tailwind.config.js` y fallan si un cambio rompe el contraste, la regla 500/600, la monotonía de las rampas, si la marca deja de ser azul, si el morado deja de ser morado o si algo vuelve al naranjo.

## Tipografía

- **Títulos: Archivo** con su eje de ancho en 106: grotesca técnica, firme y algo expandida. Reemplaza a Bricolage, cuyos trazos caprichosos se leían amistosos más que precisos.
- **Texto: Manrope**, sin cambios.
- **Código de sala y cifras grandes de la TV: Doto**, matriz de puntos como un letrero LED, con halo de neón. Es el gesto audaz de la identidad y vive solo ahí.

## Cómo cambiarla

1. Ajustar tonos, croma o luminosidad en `scripts/palette/neon.json` (o los rangos de `optimize-neon.mjs`).
2. `node scripts/palette/gen.mjs "$(cat scripts/palette/neon.json)"` y `node scripts/palette/palette.mjs scripts/palette/candidate.json`.
3. Copiar las rampas a `tailwind.config.js` y correr `npm test`.
