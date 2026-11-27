"""
Fotos de ambiente en HD (bar, club, casino, música y previa) para los fondos de Tonight.

Uso: python3 scripts/procesar-ambiente.py <carpeta con los JPG de Unsplash>
Espera los archivos nombrados por su id de Unsplash (ver public/fotos/ambiente/CREDITOS.md). Recorta a 16:9, deja
2560 px (y 1280 px para celular), oscurece y vira apenas a la paleta neón, SIN desenfoque: la nitidez la pone la foto y
el velo de AmbientPhoto se encarga de que el texto se lea.
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

FOTOS = {"club": "41j1aAy78Ok", "bar": "yQtV3AxfOW0", "casino": "PLfpXxZ9r9A", "musica": "3KdcvnWzVQU", "previa": "lDgDpQTsZBU"}
# Cuánto se lleva cada foto a la paleta neón con un mapa de degradado (la del DJ viene verde)
VIRAJE = {"musica": 0.62, "previa": 0.18}
MAPA = [(0.0, (10, 6, 22)), (0.45, (58, 30, 112)), (0.75, (103, 170, 255)), (1.0, (236, 226, 255))]
SALIDA = Path(__file__).resolve().parent.parent / "public" / "fotos" / "ambiente"
CWEBP = "/opt/homebrew/bin/cwebp"
TINTE = (22, 14, 44)  # noche morada de la paleta


def procesar(origen: Path, nombre: str) -> None:
    img = Image.open(origen).convert("RGB")
    w, h = img.size
    # Recorte 16:9 al centro
    if w / h > 16 / 9:
        nw = int(h * 16 / 9)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w * 9 / 16)
        img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    v = VIRAJE.get(nombre, 0)
    if v:
        gris = img.convert("L")
        lut = []
        for c in range(3):
            for i in range(256):
                t = i / 255
                for (a, ca), (b, cb) in zip(MAPA, MAPA[1:]):
                    if a <= t <= b:
                        k = (t - a) / (b - a)
                        lut.append(int(ca[c] + (cb[c] - ca[c]) * k))
                        break
        mapa = Image.merge("RGB", [gris.point(lut[i * 256:(i + 1) * 256]) for i in range(3)])
        img = Image.blend(img, mapa, v)
    img = ImageEnhance.Brightness(img).enhance(0.78)
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = Image.blend(img, Image.new("RGB", img.size, TINTE), 0.14)
    for ancho, sufijo, calidad in ((2560, "", 80), (1280, "-sm", 78)):
        out = img.resize((ancho, ancho * 9 // 16), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
        tmp = SALIDA / f".{nombre}{sufijo}.png"
        out.save(tmp)
        subprocess.run([CWEBP, "-quiet", "-q", str(calidad), "-m", "6", str(tmp), "-o", str(SALIDA / f"{nombre}{sufijo}.webp")], check=True)
        tmp.unlink()
        print(f"{nombre}{sufijo}.webp {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    carpeta = Path(sys.argv[1])
    for nombre, uid in FOTOS.items():
        procesar(carpeta / f"{uid}.jpg", nombre)
