# Paleta V11 — «Brasa»

Paleta oscura cálida para usar de noche, en el celular y en la TV. La fuente de verdad es `tailwind.config.js`; este documento explica de dónde sale cada decisión y cómo se validó.

## El estudio

Investigación profunda en NotebookLM (59 fuentes, 43 importadas al [cuaderno de Tonight](https://notebooklm.google.com/notebook/7ec7664b-59b0-4265-9db1-e173be1bdb96)) sobre visión nocturna, modo oscuro, contraste, daltonismo y reducción de daños. Lo que cambió la paleta:

| Hallazgo | Fuente (resumen) | Decisión en Tonight |
| --- | --- | --- |
| De noche, la luz azul de 460–490 nm activa la melanopsina y suprime la melatonina; los tonos cálidos (590–650 nm) la estimulan mucho menos. | Estudio de fotoentrenamiento circadiano (PMC), informe de NotebookLM | Superficies de **carbón cálido** (tono 55) en vez de negro azulado o ciruela. |
| El negro puro (`#000`) produce arrastre al desplazar en pantallas OLED y aplana la jerarquía. | Icons8, Mobbin, LogRocket | Fondo `#0D0907` (L 0,145). |
| El blanco puro sobre negro genera halo con astigmatismo (pupila dilatada de noche). | Icons8, Then Agency, Gerasimos Makris | Texto principal `#F1ECE8` (L 0,945), blanco roto cálido. |
| En modo oscuro las sombras no se ven: la elevación se marca con luminosidad. | Eleken, Discord (design system) | Escalones de superficie 0,145 → 0,19 → 0,225 → 0,26 → 0,31. |
| WCAG 2 sobreestima el contraste cerca del negro; APCA es perceptual y distingue polaridad. | Bridge-PCA, University of Bath, Netz-Barrierefrei | Se exigen **ambos**: 4,5:1 y Lc 90 / 75 / 60 / 45 según el uso. |
| En oscuro, los acentos deben bajar croma (≈ 20–30 %) para no vibrar. | Accessible Palette Studio, ColorArchive | Croma ≤ 0,18 en todos los acentos (salvo frambuesa, 0,22, de uso mínimo). |
| ~8 % de los hombres tiene daltonismo; el color nunca puede ser el único código. | Kahoot (formas), informe de NotebookLM | Cada estado lleva texto o ícono; la paleta se optimizó para el peor caso con daltonismo. |
| El rojo para el consumo se percibe como regaño y hace abandonar el seguimiento. | Studiomade (app sin juicio), DrinkControl, «Party safe» (UX Planet) | Escala **menta → ámbar → terracota**; el rojo queda solo para el conductor que tomó. |

## Roles

| Rol | Escala (alias en código) | 400 | 500 | 600 | OKLCH del 500 |
| --- | --- | --- | --- | --- | --- |
| Superficies | `night` | — | — | — | 950 = `oklch(0.145 0.008 55)` |
| Texto | `ink` (`slate`, `gray`) | `#BCB4AF` | `#A8A09B` | `#726A65` | 50 = `oklch(0.945 0.007 55)` |
| Marca y acción — Brasa | `ember` (`indigo`, `blue`, `orange`) | `#FFA176` | `#FF8346` | `#B64A00` | `oklch(0.74 0.18 45)` |
| En vivo, listo, calma — Menta | `lime` (`emerald`, `green`, `teal`) | `#59D2B1` | `#31C29E` | `#008469` | `oklch(0.73 0.13 172)` |
| Aviso suave — Ámbar pisco | `gold` (`amber`, `yellow`) | `#FFD375` | `#F8C655` | `#8E6A00` | `oklch(0.85 0.14 85)` |
| Solo conductor que tomó y acciones destructivas — Frambuesa | `alert` (`rose`, `red`, `pink`) | `#FF7892` | `#FD4576` | `#CB1554` | `oklch(0.67 0.22 10)` |
| Juegos — Iris | `iris` (`purple`, `violet`, `fuchsia`) | `#BFAAFF` | `#AF93FB` | `#775BB9` | `oklch(0.73 0.15 295)` |
| Agua | `aqua` (`cyan`, `sky`) | `#95D1FF` | `#72C3FF` | `#2377AC` | `oklch(0.79 0.12 242)` |

Superficies: `night-950 #0D0907` (fondo), `900 #171310` (tarjeta), `850 #201A17`, `800 #29231F` (elevada), `700 #362F2A`, `600 #463E39`.

### Reglas

1. **500 lleva texto oscuro y 600+ lleva texto blanco.** Las dos combinaciones pasan 4,5:1. Por eso `bg-indigo-600 text-white` y `bg-indigo-500 text-night-950` son correctas en todo el código.
2. **Un acento como texto usa 300 o 400** sobre las superficies: todos pasan Lc 60.
3. **El rojo frambuesa no se usa para consumo.** El Monstruómetro va de menta (0,00) a ámbar (sube) y a terracota (`orange-400`, alto). El conductor sobrio va en menta; solo el conductor que tomó va en frambuesa.
4. **Ningún estado depende solo del color**: siempre hay texto, ícono o cifra.
5. Las rampas oscurecen paso a paso (50 → 950) y nunca se usa `#000` ni `#FFF` como fondo o texto.

## Validación

Generada con `scripts/palette/gen.mjs` (OKLCH, con mapeo de gamut que reduce croma sin cambiar tono ni luminosidad), validada con `scripts/palette/palette.mjs` (WCAG 2.2, APCA-W3 0.0.98G y simulación de daltonismo de Machado 2009) y buscada con `scripts/palette/optimize.mjs` (maximiza la peor distinción entre estados). Resultado completo: `scripts/palette/report.txt`.

| Par | WCAG | APCA Lc |
| --- | --- | --- |
| Texto principal sobre fondo | 16,9:1 | 96 |
| Texto secundario (`slate-300`) sobre tarjeta | 9,9:1 | 66 |
| Metadatos (`slate-500`) sobre `night-850` | 6,7:1 | 50 |
| Texto oscuro sobre botón de marca (`indigo-500`) | 8,1:1 | 56 |
| Texto blanco sobre `indigo-600` | 5,3:1 | 81 |
| Acento como texto (`indigo-400`) sobre tarjeta | 9,3:1 | 64 |

**Distinción con daltonismo (ΔE OKLab, peor caso entre normal, protanopía, deuteranopía y tritanopía):**

| Par de estados | Paleta V10 | Paleta Brasa |
| --- | --- | --- |
| Marca vs alerta | 3 | 10 |
| En vivo vs aviso | 3 | 10 |
| En vivo vs alerta | 19 | 11 |
| Agua vs en vivo | 6 | 6 (tritanopía, ~0,01 % de la población; el agua siempre lleva gota) |

Con seis colores semánticos no existe una combinación que supere ΔE 12 en todos los pares bajo los tres tipos de daltonismo (el optimizador lo comprobó en la grilla completa). Por eso la regla 4 es obligatoria.

Las pruebas `src/lib/__tests__/palette.test.ts` leen `tailwind.config.js` y fallan si un cambio rompe el contraste, la regla 500/600 o la monotonía de las rampas. Con la paleta V10 fallan 7 de esas pruebas.

## Cómo cambiarla

1. Ajustar tonos o croma en `scripts/palette/brasa.json`.
2. `node scripts/palette/gen.mjs "$(cat scripts/palette/brasa.json)"` y `node scripts/palette/palette.mjs scripts/palette/candidate.json`.
3. Copiar las rampas a `tailwind.config.js` y correr `npm test`.
