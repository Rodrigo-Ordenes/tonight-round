"use client";

import React, { useEffect, useRef } from "react";

/**
 * Un video de YouTube que avisa cuando termina (o cuando no se puede reproducir fuera de YouTube: muchos videos
 * oficiales lo bloquean), para que la fila avance sola. Habla con el reproductor por mensajes (el mismo protocolo de
 * la API de YouTube) sin cargar scripts de terceros: la CSP solo permite el iframe.
 */
export default function YouTubeQueuePlayer({ embed, title, onEnd, onError }: { embed: string; title: string; onEnd: () => void; onError: (code: number) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const done = useRef(false);
  const cb = useRef({ onEnd, onError });
  cb.current = { onEnd, onError };
  const origin = new URL(embed).origin;
  const src = `${embed}${embed.includes("?") ? "&" : "?"}enablejsapi=1&autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}`;

  useEffect(() => {
    done.current = false;
    let ready = false;
    const finish = (fn: () => void) => {
      if (done.current) return;
      done.current = true;
      fn();
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return;
      let d: { event?: string; info?: unknown } | null = null;
      try {
        d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!d?.event) return;
      if (d.event === "onReady" || d.event === "initialDelivery") ready = true;
      const state = d.event === "onStateChange" ? d.info : d.event === "infoDelivery" ? (d.info as { playerState?: number } | null)?.playerState : undefined;
      if (state === 0) finish(cb.current.onEnd);
      if (d.event === "onError") finish(() => cb.current.onError(Number(d?.info) || 0));
    };
    window.addEventListener("message", onMsg);
    // Hasta que el reproductor conteste, se le avisa que escuchamos sus eventos
    const hello = window.setInterval(() => {
      if (ready) return;
      frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), origin);
    }, 800);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearInterval(hello);
    };
  }, [embed, origin]);

  return (
    <iframe
      ref={frame}
      title={`YouTube: ${title}`}
      src={src}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      className="block aspect-video w-full rounded-xl border-0"
    />
  );
}
