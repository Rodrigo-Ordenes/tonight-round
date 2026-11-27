"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import SectionStage, { type StageOption } from "@/components/rooms/SectionStage";
import JoinCodeForm from "@/components/gateway/JoinCodeForm";
import { useRoomActions } from "@/lib/useRoomActions";
import { useActiveCode } from "@/lib/useActiveCode";
import { SOLO } from "@/store/useCarreteStore";
import { nightMoment } from "@/lib/nightMoment";

/**
 * Apartado Sala: el host te recibe en el salón. Sin sala, dos caminos: crearla (para jugar y poner música con todos)
 * o armar la compra (con la cuenta y la rendición al final); y si te invitaron, el código. Con sala: volver a ella,
 * sus juegos y la compra con la cuenta.
 */
export default function SalaPage() {
  const { code, hydrated } = useActiveCode();
  const room = hydrated && code && code !== SOLO ? code : null;
  const { busy, error, setError, create, join, solo } = useRoomActions();
  const [codeOpen, setCodeOpen] = useState(false);
  const [eyebrow, setEyebrow] = useState("La sala");

  useEffect(() => {
    setEyebrow(nightMoment(new Date()).eyebrow);
    if (new URLSearchParams(window.location.search).get("codigo") === "1") setCodeOpen(true);
  }, []);

  // Retorno seguro: pedir el viaje y avisar a los tuyos que llegaste, con o sin sala
  const volver: StageOption = { id: "volver", label: "Volver seguro", hint: "Pide el viaje y avisa a los tuyos cuando llegues", icon: "🏠", href: "/seguridad" };
  const options: StageOption[] = room
    ? [
        { id: "entrar", label: `Entrar a tu sala ${room}`, hint: "Invitados, la TV y lo que está pasando", icon: "📡", href: `/carrete/${room}`, primary: true },
        { id: "juegos", label: "Juegos de la sala", hint: "Cada celular vota en secreto y la TV revela", icon: "🎲", href: "/juegos" },
        { id: "compra", label: "La compra y la cuenta", hint: "La lista con precios y quién le transfiere a quién", icon: "🧾", href: "/armar" },
        volver,
      ]
    : [
        { id: "crear", label: "Crear sala", hint: "Para jugar y poner música con todos", icon: "✨", onSelect: () => void create(), primary: true, busy: busy === "create" },
        { id: "compra", label: "Armar la compra", hint: "La lista con precios reales y, al final, la cuenta", icon: "🛒", href: "/armar" },
        { id: "codigo", label: "Tengo un código", hint: "Me invitaron a una sala", icon: "🔑", onSelect: () => setCodeOpen((o) => !o) },
        volver,
      ];

  const lines = room
    ? [
        `Tu sala ${room} está encendida. ¿Seguimos?`,
        "Los juegos de la sala ya están listos: se juegan con los celulares y la TV.",
        "La compra y la cuenta, claritas: quien maneja no paga el alcohol.",
        "Cuando sea hora de volver, te ayudo a pedir el viaje y a avisar que llegaste.",
      ]
    : [
        "¿Armamos la noche? Crea la sala y comparte el código con tu gente.",
        "¿Primero la compra? Te armo la lista con precios reales y la cuenta clara al final.",
        "Si te invitaron, dame el código y te hago pasar.",
        "Cuando sea hora de volver, te ayudo a pedir el viaje y a avisar que llegaste.",
      ];

  return (
    <SectionStage id="sala" video="sala" eyebrow={eyebrow} title="La sala" lines={lines} options={options} active={codeOpen ? "codigo" : null}>
      {codeOpen && !room && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+6.25rem)] z-30 mx-auto max-w-lg animate-rise-in sm:inset-x-6">
          <div className="surface relative overflow-hidden p-5 shadow-lift sm:p-6">
            <JoinCodeForm onJoin={(c) => void join(c)} onSolo={solo} onClose={() => setCodeOpen(false)} busy={busy === "join"} error={error} clearError={() => setError(null)} />
          </div>
        </div>
      )}
      {error && !codeOpen && (
        <div role="alert" className="fixed inset-x-3 top-20 z-30 mx-auto flex max-w-lg items-start gap-2 rounded-2xl border border-rose-500/40 bg-night-950/90 p-3 text-sm font-semibold text-rose-200 backdrop-blur-md">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </SectionStage>
  );
}
