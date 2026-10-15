import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display text-display-lg mt-3">
        Esta página se fue al after<span className="text-gradient-ember">.</span>
      </h1>
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
