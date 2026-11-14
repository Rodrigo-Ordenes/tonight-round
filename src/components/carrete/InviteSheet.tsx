"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, MessageCircle, Share2, Smartphone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ScrambleCode from "@/components/ui/ScrambleCode";
import { inviteMessage, inviteUrl } from "@/lib/invite";

/**
 * Lo primero que ve quien crea una sala: cómo hacer entrar a los demás y entrar uno mismo.
 * Se abre con `?invitar=1` justo después de crear la sala.
 */
export default function InviteSheet({
  code,
  partyName,
  onClose,
  onJoin,
}: {
  code: string;
  partyName: string;
  onClose: () => void;
  onJoin: () => void;
}) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const link = inviteUrl(window.location.origin, code);
    setUrl(link);
    setCanShare(typeof navigator.share === "function");
    QRCode.toDataURL(link, { width: 360, margin: 1, color: { dark: "#090A0D", light: "#ECECF1" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);

  const message = inviteMessage(code, url, partyName);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal labelledBy="invite-title" onClose={onClose} className="flex items-end justify-center bg-night-950/80 p-0 sm:items-center sm:p-4">
      <section className="surface w-full max-w-md !rounded-b-none p-6 sm:!rounded-b-2xl">
        <h2 id="invite-title" className="display text-3xl">
          Sala lista
        </h2>
        <p className="meta mt-2">Que cada persona entre desde su celular con el código o el QR.</p>

        <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4">
          <ScrambleCode code={code} className="neon-violet font-led text-5xl font-black tracking-[0.1em]" />
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR para entrar a la sala ${code}`} width={112} height={112} className="rounded-xl" />
          ) : (
            <span className="h-28 w-28 rounded-xl bg-white/[0.04]" aria-hidden />
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {canShare ? (
            <button type="button" className="btn-ghost !px-2" onClick={() => navigator.share({ title: "Tonight", text: message, url }).catch(() => undefined)}>
              <Share2 className="h-4 w-4" aria-hidden /> Compartir
            </button>
          ) : (
            <a className="btn-ghost !px-2" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
          )}
          {canShare && (
            <a className="btn-ghost !px-2" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
          )}
          <button type="button" className={`btn-ghost !px-2 ${canShare ? "" : "col-span-2"}`} onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>

        <button type="button" onClick={onJoin} className="btn-primary mt-4 w-full">
          <Smartphone className="h-4 w-4" aria-hidden /> Unirme yo también
        </button>
        <button type="button" onClick={onClose} className="mt-2 min-h-[44px] w-full text-sm font-semibold text-slate-400">
          Ahora no
        </button>
      </section>
    </Modal>
  );
}
