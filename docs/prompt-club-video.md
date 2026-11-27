# Prompt para los clips del club en Gemini (Veo)

El inicio de Tonight es una sala en 3D: las cinco zonas del club son sus paredes y la cámara gira entre ellas. Hoy cada
pared muestra una foto real con movimiento lento. Con estos clips, cada pared pasa a ser un loop de video y la sala se
siente como un video interactivo. Puedes partir de la foto de cada zona (`public/fotos/ambiente/<foto>.webp`) como
imagen de referencia, así el clip calza con lo que ya se ve.

Guarda cada clip como `public/video/club/<zona>.mp4` (y la versión vertical como `<zona>-9x16.mp4`) y pídeme que los
active, o agrégalos tú en `src/data/clubVideos.ts`.

## 1. Estilo (una vez, al inicio del chat)

```text
Vamos a crear loops de video para el interior de un club nocturno de primer nivel, para la web de Tonight (una app
chilena para carretes). Reglas para todos los clips:

- Video realista, como grabado con cámara de cine en un club de verdad. Nada de animación ni ilustración.
- Iluminación de neón en solo dos colores: azul #67AAFF y morado #B93EF3, con algún destello menta #8CE3BE. Nada de
  rojo ni naranjo. Ambiente oscuro, humo suave, reflejos en superficies.
- Cámara casi quieta: un movimiento muy lento de dolly o un leve vaivén, como una steadicam respirando. Sin cortes.
- LOOP PERFECTO: el último cuadro debe calzar con el primero, sin salto.
- Sin personas en primer plano ni caras reconocibles (siluetas lejanas y fuera de foco están bien).
- Sin texto, sin logos, sin marcas en botellas, máquinas ni pantallas.
- 16:9, 1920×1080, 24 fps, 6 a 8 segundos, sin audio.
```

## 2. Los clips (uno por mensaje)

| Archivo | Zona | Pide |
| --- | --- | --- |
| `juegos.mp4` | Los juegos | La sala de juegos del club: tragamonedas con luces que parpadean y una mesa de casino con paño verde al fondo, fichas apiladas, una ruleta girando muy lento fuera de foco |
| `bar.mp4` | El bar | La contrabarra iluminada desde abajo: botellas sin etiqueta legible en repisas de vidrio, vasos que brillan, una gota que cae de una coctelera plateada sobre la barra |
| `musica.mp4` | La música | La cabina del DJ entre humo: tornamesas y mezclador con perillas iluminadas, luces que barren el techo al ritmo, el DJ como silueta lejana |
| `dividir.mp4` | La cuenta | El lounge: sillones de terciopelo, mesa baja con velas y vasos, una bandeja con la cuenta doblada; luz cálida tenue mezclada con el neón |
| `armar.mp4` | La previa | Una mesa larga de previa en casa de noche: botellas en fila iluminadas desde atrás, hielo en una hielera que suda, bolsas de compras y limones; luz de neón que entra por la ventana |
| `entrada.mp4` (opcional) | La puerta | La puerta acolchada del club abriéndose hacia el interior iluminado, la cámara avanza y cruza el umbral (este no es loop: 4 segundos) |

Para el celular, pide la misma escena en vertical 9:16 (1080×1920) y guárdala como `<zona>-9x16.mp4`.

## 3. Si algo sale mal, pide

- «Sin cortes: que el final calce con el principio para que el loop no salte.»
- «Quita las marcas y el texto de las botellas y pantallas.»
- «Las luces están rojas o naranjas: llévalas al azul #67AAFF y al morado #B93EF3.»
- «Menos movimiento de cámara: casi quieta, solo un vaivén muy lento.»

## 4. Antes de subirlos

Cada clip debería pesar menos de 3 MB. Si pesa más, pídeme que lo comprima. Lo hago con ffmpeg (H.264, CRF 26, sin
audio, `faststart`) y genero el póster del primer cuadro.
