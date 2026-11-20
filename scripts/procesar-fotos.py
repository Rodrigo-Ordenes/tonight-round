#!/usr/bin/env python3
"""Fotos reales de los tragos: de fotos-originales/ a public/fotos/tragos/ listas para la cinta.

Por cada foto (piscola.png, pisco_sour.jpg…; el nombre es el id del trago):
1. Recorta el vaso con fondo transparente (scripts/recortar-foto.swift, Vision de macOS).
2. Ajusta el encuadre al vaso con un margen y la deja a 640 px de alto.
3. La guarda en WebP con transparencia (cwebp) y anota su tamaño en src/data/fotosTragos.ts.

Uso: python3 scripts/procesar-fotos.py   (vuelve a procesar solo las fotos nuevas o cambiadas)
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fotos-originales"
OUT = ROOT / "public" / "fotos" / "tragos"
MANIFEST = ROOT / "src" / "data" / "fotosTragos.ts"
HEIGHT = 640
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def process(photo: Path, tmp: Path) -> dict:
    drink = photo.stem
    cut = tmp / f"{drink}.png"
    subprocess.run(["swift", str(ROOT / "scripts" / "recortar-foto.swift"), str(photo), str(cut)], check=True, capture_output=True)
    im = Image.open(cut).convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        raise RuntimeError(f"{photo.name}: el recorte quedó vacío")
    pad = round((box[3] - box[1]) * 0.02)
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    im = im.crop(box)
    width = round(im.width * HEIGHT / im.height)
    im = im.resize((width, HEIGHT), Image.LANCZOS)
    png = tmp / f"{drink}-final.png"
    im.save(png)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{drink}.webp"
    subprocess.run(["cwebp", "-quiet", "-q", "82", "-alpha_q", "90", "-m", "6", str(png), "-o", str(target)], check=True)
    print(f"{photo.name} → {target.relative_to(ROOT)} ({width}×{HEIGHT}, {target.stat().st_size // 1024} KB)")
    return {"src": f"/fotos/tragos/{drink}.webp", "w": width, "h": HEIGHT}


def main() -> int:
    photos = sorted(p for p in SRC.glob("*") if p.suffix.lower() in EXTS)
    if not photos:
        print(f"No hay fotos en {SRC}")
        return 1
    entries: dict[str, dict] = {}
    with tempfile.TemporaryDirectory() as tmp:
        for photo in photos:
            target = OUT / f"{photo.stem}.webp"
            if target.exists() and target.stat().st_mtime >= photo.stat().st_mtime:
                with Image.open(target) as done:
                    entries[photo.stem] = {"src": f"/fotos/tragos/{photo.stem}.webp", "w": done.width, "h": done.height}
                continue
            entries[photo.stem] = process(photo, Path(tmp))
    body = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in sorted(entries.items()))
    MANIFEST.write_text(
        "// Generado por scripts/procesar-fotos.py: fotos reales de los tragos (vaso recortado, fondo transparente).\n"
        "// Los tragos sin foto siguen con su dibujo.\n"
        "export const FOTOS_TRAGOS: Record<string, { src: string; w: number; h: number }> = {\n" + body + ",\n};\n",
        encoding="utf8",
    )
    print(f"{len(entries)} foto(s) en {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
