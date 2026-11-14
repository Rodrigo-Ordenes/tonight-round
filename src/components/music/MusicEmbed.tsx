"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Radio } from "lucide-react";
import type { NowPlaying } from "@/lib/music";

/**
 * El reproductor de la sala según lo que suena: Spotify incrustado, YouTube en 16:9 (sin cookies) o, para el Jam de
 * Spotify, que no se puede incrustar, una tarjeta para unirse desde la app y (en la TV) su QR.
 */
export default function MusicEmbed({
  np,
  size = "main",
  qr = false,
}: {
  np: NowPlaying;
  size?: "main" | "mini" | "tv";
  qr?: boolean;
}) {
  if (!np.embed) return <JamCard np={np} size={size} qr={qr} />;
  if (np.provider === "youtube") {
    return (
      <>
        <IpHostNote />
        <iframe
          key={np.embed}
          title={`YouTube: ${np.title}`}
          src={np.embed}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="block aspect-video w-full rounded-2xl border-0"
        />
      </>
    );
  }
  return (
    <iframe
      key={np.embed}
      title={`Spotify: ${np.title}`}
      src={np.embed}
      width="100%"
      height={size === "mini" ? 80 : 380}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="block rounded-2xl border-0"
    />
  );
}

function JamCard({
  np,
  size,
  qr,
}: {
  np: NowPlaying;
  size: "main" | "mini" | "tv";
  qr: boolean;
}) {
  const [code, setCode] = useState("");
  useEffect(() => {
    if (!qr) return;
    QRCode.toDataURL(np.open, {
      width: 360,
      margin: 1,
      color: { dark: "#090A0D", light: "#ECECF1" },
    })
      .then(setCode)
      .catch(() => setCode(""));
  }, [qr, np.open]);

  const tv = size === "tv";
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-purple-400/30 bg-purple-500/[0.08] ${tv ? "p-6" : size === "mini" ? "p-3" : "p-5"}`}
    >
      {qr && code && (
        <img
          src={code}
          alt="Código QR para unirse al Jam"
          className={`${tv ? "h-40 w-40" : "h-28 w-28"} shrink-0 rounded-xl`}
        />
      )}
      <div className="min-w-0">
        <p
          className={`flex items-center gap-2 font-display font-bold text-white ${tv ? "text-tv-sm" : "text-base"}`}
        >
          <Radio
            className={
              tv ? "h-7 w-7 text-purple-300" : "h-4 w-4 text-purple-300"
            }
            aria-hidden
          />{" "}
          Jam de Spotify
        </p>
        <p className={`mt-1 text-slate-300 ${tv ? "text-xl" : "text-xs"}`}>
          {qr
            ? "Escanéalo para sumar tus canciones a la cola."
            : "Spotify no deja incrustar el Jam: se abre en tu app y cada uno suma canciones a la cola."}
        </p>
        {!tv && (
          <a
            href={np.open}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3 !min-h-[44px]"
          >
            Unirme al Jam <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * YouTube no reproduce videos incrustados cuando la página se abre por una IP (127.0.0.1, 192.168…): muestra «video no
 * disponible». Por dominio (o localhost) funciona. Si es el caso, se avisa para no culpar al enlace.
 */
function IpHostNote() {
  const [ip, setIp] = useState(false);
  useEffect(() => {
    const h = window.location.hostname;
    setIp(/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":"));
  }, []);
  if (!ip) return null;
  return (
    <p
      role="note"
      className="mb-2 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-100"
    >
      YouTube no reproduce incrustado cuando la página se abre por una dirección
      IP. Ábrela por su dominio (o localhost) o usa «Abrir en YouTube».
    </p>
  );
}
