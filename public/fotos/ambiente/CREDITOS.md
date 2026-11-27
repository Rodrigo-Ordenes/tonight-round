# Fotos de ambiente

Fotos de [Unsplash](https://unsplash.com) con la licencia gratuita de Unsplash (uso libre, también comercial; ninguna
de Unsplash+). Recortadas a 16:9, oscurecidas y viradas apenas a la paleta Neón, sin desenfoque (2560 px y 1280 px para celular). Se regeneran con `scripts/procesar-ambiente.py`.

| Archivo | Original |
| --- | --- |
| `bar.webp` | https://unsplash.com/photos/yQtV3AxfOW0 |
| `club.webp` | https://unsplash.com/photos/41j1aAy78Ok |
| `casino.webp` | https://unsplash.com/photos/PLfpXxZ9r9A |
| `musica.webp` | https://unsplash.com/photos/3KdcvnWzVQU (virada a la paleta: venía verde) |
| `previa.webp` | https://unsplash.com/photos/lDgDpQTsZBU |

## Mapas de profundidad

`<nombre>-depth.webp` (1024 × 576, en grises: claro es cerca) se generaron con
[Depth Anything V2 small](https://huggingface.co/onnx-community/depth-anything-v2-small) (licencia Apache-2.0) a partir
de cada foto. La sala 3D los usa para dar relieve a las fotos. Se regeneran con `scripts/profundidad-ambiente.mjs`.
