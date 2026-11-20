import Link from "next/link";
import { FOTO_HOST_SALUDO } from "@/data/fotosEscena";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FOTO_HOST_SALUDO.src}
        alt=""
        aria-hidden
        width={FOTO_HOST_SALUDO.w}
        height={FOTO_HOST_SALUDO.h}
        decoding="async"
        className="mb-4 h-36 w-auto self-start select-none object-contain"
      />
      <h1 className="display text-display-lg">
        Esta página se fue al after<span className="text-accent">.</span>
      </h1>
      <p className="meta mt-3">Error 404</p>
      <p className="mt-4 text-slate-300">No encontramos lo que buscabas. Si alguien te pasó un código de sala, ingrésalo en el inicio.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="btn-primary">
          Ir al inicio
        </Link>
        <Link href="/juegos" className="btn-ghost">
          Ver juegos
        </Link>
      </div>
    </div>
  );
}
