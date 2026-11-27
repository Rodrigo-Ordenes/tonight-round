# Prompt para regenerar el host de Tonight en Gemini

Pega primero el bloque de estilo y después pide cada pose en el mismo chat. Guarda cada imagen en
`fotos-originales/host-neon/` con el nombre indicado y corre `python3 scripts/procesar-escena.py --solo-host`
(o pídeme que las integre).

## 1. Estilo (una vez, al inicio del chat)

```text
Vamos a crear el personaje anfitrión («host») de Tonight, una app chilena para carretes y fiestas con amigos. Es un
letrero de neón real, fotografiado, no un dibujo plano:

PERSONAJE
- Un barman anfitrión chileno de unos 35 años, elegante y cercano, como el host de un club de cócteles de primer
  nivel. Rostro propio y amable: sonrisa cálida, barba corta bien cuidada y pelo peinado hacia atrás con un mechón.
- Viste chaleco de barman ajustado, camisa arremangada hasta el codo y una humita (corbata de lazo) cuya forma
  recuerda dos copas que brindan.
- Su objeto característico es una COCTELERA plateada (shaker) y un paño de bar sobre el hombro.
- PROHIBIDO, para que no se parezca a ningún personaje existente: sombrero de copa, monóculo, cadena de monóculo,
  bastón, bigote de manubrio, frac o levita, guantes blancos. Que no recuerde al personaje del Monopoly ni a ningún
  mago, cirquero o mascota conocida.

ESTILO DE LETRERO DE NEÓN
- Hecho con tubos de vidrio de neón reales, de grosor constante, curvados como un letrero artesanal.
- Solo dos colores de tubo: azul neón #67AAFF (lado izquierdo del cuerpo) que pasa a morado neón #B93EF3 (lado
  derecho), igual que el logo de la app (dos copas que brindan en tubos azul y morado). Detalles muy pequeños
  (chispas, brillo de la coctelera) en menta #8CE3BE. Nada de rosado, magenta, rojo ni naranjo.
- Se ven los soportes metálicos del letrero y un cable delgado que baja, como un letrero de verdad.
- Resplandor (glow) suave alrededor de los tubos, sin sobresaturar.
- Fondo NEGRO puro y liso (#000000), sin muro, sin texto, sin logos ni marcas de agua. El personaje centrado con aire
  alrededor, para recortarlo.

FORMATO
- Vertical 4:5, la mayor resolución posible. Mismo estilo, grosor de tubo, colores y personaje en todas las poses.
```

## 2. Las poses (una por mensaje)

| Archivo | Pide |
| --- | --- |
| `barman.png` | Cuerpo entero, de pie detrás de una barra insinuada con dos líneas de neón, agitando la coctelera con una mano y con la otra abierta invitando hacia su izquierda (el lado izquierdo de la imagen) |
| `saludo.png` | Plano medio, saludando con una leve reverencia y la mano en el pecho, sonriendo a cámara |
| `avatar.png` | Solo el busto, de frente, simple y legible a 40 px: cara, peinado, humita de copas y la coctelera asomando. Trazo más grueso y menos detalles |
| `paga.png` (opcional) | Celebrando un premio: brazos arriba y la coctelera en alto, con chispas menta (para cuando paga el casino) |

## 3. Si algo sale mal, pide

- «Quita el sombrero/monóculo/bastón: no debe parecerse a ningún personaje conocido.»
- «Los tubos están rosados: llévalos al morado #B93EF3 y al azul #67AAFF, sin rosado.»
- «Pon el fondo negro puro y liso, sin muro ni texto.»
