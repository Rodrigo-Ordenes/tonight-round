#!/usr/bin/env python3
"""Fotos de la portada: los vasos de la intro (pares lleno/vacío) y el host de la bienvenida.

- fotos-originales/intro/{trago}.webp y {trago}_vacio.webp → public/fotos/intro/, recortados con el MISMO encuadre
  para que calcen al superponerse; la diferencia entre ambos marca dónde está el líquido (lo que se llena).
  El agua no tiene foto vacía: usa la del vaso alto con solo hielo (piscola_vacio), mismo encuadre.
- fotos-originales/host/barman.webp → public/fotos/host/barman.webp: recortado, volteado para que su mano invite
  hacia la carta y llevado a los neones de la página (azul #67AAFF, morado #B93EF3) con filo de luz en el contorno.
Escribe src/data/fotosEscena.ts con tamaños y nivel del líquido. Uso: python3 scripts/procesar-escena.py
"""
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fotos-originales"
OUT = ROOT / "public" / "fotos"
MANIFEST = ROOT / "src" / "data" / "fotosEscena.ts"
SWIFT = ROOT / "scripts" / "recortar-foto.swift"


def cutout(photo: Path, tmp: Path) -> Image.Image:
    out = tmp / f"{photo.parent.name}-{photo.stem}.png"
    subprocess.run(["swift", str(SWIFT), str(photo), str(out)], check=True, capture_output=True)
    return Image.open(out).convert("RGBA")


def bbox(im: Image.Image):
    return im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()


def webp(im: Image.Image, target: Path, tmp: Path, q: int = 82):
    target.parent.mkdir(parents=True, exist_ok=True)
    png = tmp / f"{target.stem}-final.png"
    im.save(png)
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", "90", "-m", "6", str(png), "-o", str(target)], check=True)
    print(f"→ {target.relative_to(ROOT)} ({im.width}×{im.height}, {target.stat().st_size // 1024} KB)")


def pair(full_img: Image.Image, empty_img: Image.Image, height: int):
    """Mismo recorte y escala para el lleno y el vacío, y el tramo vertical donde difieren (el líquido)"""
    a, b = bbox(full_img), bbox(empty_img)
    box = (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))
    pad = round((box[3] - box[1]) * 0.02)
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(full_img.width, box[2] + pad), min(full_img.height, box[3] + pad))
    width = round((box[2] - box[0]) * height / (box[3] - box[1]))
    f = full_img.crop(box).resize((width, height), Image.LANCZOS)
    e = empty_img.crop(box).resize((width, height), Image.LANCZOS)
    fa = np.asarray(f).astype(np.float32)
    ea = np.asarray(e).astype(np.float32)
    alpha = np.minimum(fa[..., 3], ea[..., 3]) / 255
    diff = (np.abs(fa[..., :3] - ea[..., :3]).mean(-1) / 255) * alpha
    rows = diff.mean(1)
    hot = np.where(rows > max(0.02, rows.max() * 0.18))[0]
    top, bottom = (int(hot.min()), int(hot.max())) if hot.size else (int(height * 0.1), int(height * 0.92))
    return f, e, round(top / height, 3), round(bottom / height, 3)


def neon_grade(im: Image.Image) -> Image.Image:
    """Azules al azul neón y morados al morado neón de la página (la piel no se toca) y un filo de luz en el contorno"""
    rgba = np.asarray(im).astype(np.float32)
    alpha = rgba[..., 3] / 255
    hsv = np.asarray(Image.fromarray(rgba[..., :3].astype(np.uint8), "RGB").convert("HSV")).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    blue = (h >= 180) & (h < 248) & (s > 0.18)
    purple = (h >= 248) & (h < 335) & (s > 0.18)
    h2 = h.copy()
    # Mitad de camino hacia la paleta y sin subir la saturación: la tela sigue viéndose como tela
    h2[blue] += (213.5 - h[blue]) * 0.5
    h2[purple] += (281 - h[purple]) * 0.5
    s2 = s.copy()
    s2[blue | purple] = np.clip(s[blue | purple] * 0.95, 0, 1)
    graded = Image.fromarray(np.stack([h2 * 255 / 360, s2 * 255, v * 255], -1).clip(0, 255).astype(np.uint8), "HSV").convert("RGB")
    out = np.asarray(graded).astype(np.float32) / 255
    # Filo de luz: el borde del contorno se ilumina, morado a la izquierda y azul a la derecha
    a_img = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    soft = np.asarray(a_img.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    rim = np.clip((alpha - soft) * 2.4, 0, 1)[..., None]
    x = np.linspace(0, 1, out.shape[1])[None, :, None]
    violet = np.array([185, 62, 243]) / 255
    blue_c = np.array([103, 170, 255]) / 255
    light = violet * (1 - x) + blue_c * x
    out = 1 - (1 - out) * (1 - light * rim * 0.38)
    rgba_out = np.concatenate([out * 255, (alpha * 255)[..., None]], -1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba_out, "RGBA")


def main() -> int:
    import sys
    solo_host = "--solo-host" in sys.argv
    manifest: dict = {"intro": {}, "host": None}
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        intro = SRC / "intro"
        if solo_host:
            # Solo el host: el resto del manifiesto queda como estaba
            prev = MANIFEST.read_text(encoding="utf8")
            manifest["intro"] = json.loads(prev.split("> = ", 1)[1].split(";\n", 1)[0])
        base_empty = None if solo_host else cutout(intro / "piscola_vacio.webp", tmp)
        for drink in [] if solo_host else ["piscola", "cerveza", "vino", "agua"]:
            full_path = intro / f"{drink}.webp"
            if not full_path.exists():
                continue
            empty_path = intro / f"{drink}_vacio.webp"
            full_img = cutout(full_path, tmp)
            empty_img = cutout(empty_path, tmp) if empty_path.exists() else base_empty
            f, e, top, bottom = pair(full_img, empty_img, 520)
            webp(f, OUT / "intro" / f"{drink}.webp", tmp)
            webp(e, OUT / "intro" / f"{drink}_vacio.webp", tmp)
            manifest["intro"][drink] = {"lleno": f"/fotos/intro/{drink}.webp", "vacio": f"/fotos/intro/{drink}_vacio.webp", "w": f.width, "h": f.height, "top": top, "bottom": bottom}
        host = SRC / "host" / "barman.webp"
        if host.exists():
            im = cutout(host, tmp).transpose(Image.FLIP_LEFT_RIGHT)
            box = bbox(im)
            im = im.crop(box)
            height = 1100
            im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
            im = neon_grade(im)
            webp(im, OUT / "host" / "barman.webp", tmp, q=80)
            manifest["host"] = {"src": "/fotos/host/barman.webp", "w": im.width, "h": im.height}
    MANIFEST.write_text(
        "// Generado por scripts/procesar-escena.py: vasos de la intro (lleno y vacío, mismo encuadre; top/bottom = tramo\n"
        "// del líquido en fracción del alto) y el host de la bienvenida.\n"
        f"export const FOTOS_INTRO: Record<string, {{ lleno: string; vacio: string; w: number; h: number; top: number; bottom: number }}> = {json.dumps(manifest['intro'], indent=2)};\n\n"
        f"export const FOTO_HOST: {{ src: string; w: number; h: number }} | null = {json.dumps(manifest['host'])};\n",
        encoding="utf8",
    )
    print(f"manifiesto: {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
