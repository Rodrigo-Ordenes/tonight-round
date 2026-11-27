/*
 * Mapas de profundidad de las fotos de ambiente (public/fotos/ambiente/<nombre>-depth.webp), con Depth Anything V2
 * small (Apache-2.0, onnx-community en Hugging Face) vía transformers.js. La sala 3D los usa para dar relieve real a
 * cada foto. No es parte del build ni de las dependencias del proyecto: se corre a mano en una carpeta aparte.
 *
 *   mkdir -p /tmp/profundidad && cd /tmp/profundidad && npm init -y && npm i @huggingface/transformers@3 sharp
 *   node <ruta-al-repo>/scripts/profundidad-ambiente.mjs <ruta-al-repo>/public/fotos/ambiente bar casino club musica previa
 *
 * (Baja el modelo una vez, ~99 MB, a ./models de esa carpeta.)
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "noop.js"));
const { pipeline, RawImage, env } = await import(require.resolve("@huggingface/transformers"));
const sharp = (await import(require.resolve("sharp"))).default;

env.cacheDir = path.resolve("./models");
const [, , dir, ...names] = process.argv;
const estimator = await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small", { dtype: "fp32" });
for (const n of names) {
  // La foto a 1036 px (múltiplo de 14, el parche del modelo): más detalle que los 518 por defecto
  const buf = await sharp(path.join(dir, `${n}.webp`)).resize(1036).png().toBuffer();
  const { depth } = await estimator(await RawImage.fromBlob(new Blob([buf])));
  const out = path.join(dir, `${n}-depth.webp`);
  await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: depth.channels } })
    .resize(1024, 576, { fit: "fill" })
    .blur(1.4)
    .normalise()
    .toColourspace("b-w")
    .webp({ quality: 82 })
    .toFile(out);
  console.log("listo", out);
}
