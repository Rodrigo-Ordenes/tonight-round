# Tonight V12 «Señal» — diseño

Pedido del 2026-11-12: «mejorar el proyecto al 100 %, animaciones mejores y una web más tecnológica; ejecutarlo de forma autónoma» (prompt: `docs/prompt-maestro-v12.md`). La persona pidió ejecutar sin ronda de preguntas, así que las decisiones quedan registradas como Ruling.

## Intención

Que Tonight se sienta como un instrumento vivo de la noche: responde al instante, muestra lo que pasa en la sala en tiempo real y tiene una escena que se recuerda. Que además arregle lo que la auditoría marcó como crítico en el uso real.

**Sería un fracaso si:** se ve como plantilla «tech» (brillos, degradados, etiquetas monoespaciadas en mayúsculas), el movimiento distrae de jugar y tomar decisiones, la intro frena a quien llega a una sala, o se rompe algo de lo ya probado.

## Enfoques para «tecnológico»

| Enfoque | Compromiso | Decisión |
| --- | --- | --- |
| Estética HUD: etiquetas monoespaciadas en mayúsculas, marcos, brillos | Rápido, pero `frontend-design` lo marca como el cliché más común; choca con el piso de calidad | Descartado |
| Vaso 3D con WebGL o Three.js | Impacta, pero agrega dependencias pesadas, gasta batería de noche y complica accesibilidad | Descartado |
| **SVG + canvas propios con física suavizada y datos reales** | Más trabajo fino; sin dependencias nuevas en tiempo de ejecución | **Elegido** |

## Diseño

**Una escena memorable: la intro del trago 2.0.** El scroll controla el sirviendo, pero el vaso no salta: interpola por cuadro con una vida media de ~90 ms. La superficie del líquido es una onda que se agita según la velocidad del scroll; hay burbujas cuando entra la bebida y el hielo flota con el nivel. Junto al vaso se leen datos reales del trago (30/70: 60 ml de pisco de 35° y 140 ml de bebida → 10,5 % y 16,8 g de alcohol puro) que se calculan en vivo. Al terminar aparece la acción: «Crear sala» o «Tengo un código», como la referencia del plato que termina en el ingreso. Las etiquetas de cada paso se decodifican letra a letra, el mismo gesto que el código de sala.

**Datos en vivo en la TV.** La red de la sala deja de ser decorativa: cada punto es una persona real con su nombre, quien llega entra con una transición corta y por cada acción real (trago, agua, voto, canción, brindis) viaja una señal hasta la pantalla. El revelado de una ronda se escalona y los conteos suben.

**La portada responde.** Al escribir cada carácter del código o al crear la sala, la red manda señales: el movimiento contesta a la persona.

**Calma en lo demás.** Los controles del celular no se animan; las cifras de alcohol y los montos no se mueven. Las etiquetas de sección pasan de mayúsculas espaciadas a minúsculas de oración.

## Críticos de uso incluidos

Estado de conexión visible en el celular; confirmación y deshacer al sumar un trago, con protección contra doble toque; horizontal sin que barra y dock tapen la pantalla; hoja de invitación apenas se crea la sala; «Cambiar de persona» solo entre quienes se agregaron en ese celular.

## Música

«Pon tu música» entiende Spotify (playlist, álbum, canción, artista, Jam) y YouTube (lista o video). Los enlaces se validan también en el reductor. El Jam se muestra como botón y QR en la TV, porque Spotify no permite incrustarlo. El texto es honesto: con sesión de Spotify en ese navegador suelen sonar canciones completas; sin sesión, adelantos de 30 s.

## Ingeniería

Playwright para el flujo crear sala → unirse → ronda → revelar, y para cabeceras de seguridad. CI en GitHub Actions con pruebas, tipos, build y E2E.

## Restricciones

Gratis, sin login, español, 4 países. Alcohol educativo y sin castigo. Acciones de sala idempotentes. Colores desde `tailwind.config.js`. Movimiento solo con transform/opacity en HTML, ≤ 300 ms en UI, curva `cubic-bezier(0.23, 1, 0.32, 1)`, y nada de esto con `prefers-reduced-motion`. Sin commit, push ni publicación sin autorización.

## Decisiones del constructor

Valores finos de la física (vida media, amplitud), número de burbujas y tipografía de las lecturas, mientras respeten las pruebas y el rendimiento.
