"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { StageOption } from "@/components/rooms/SectionStage";
import WorldSectionStage from "../WorldSectionStage";
import { useWorld } from "../WorldProvider";

/*
 * La vista del laboratorio: igual que un apartado de verdad (WorldSectionStage con sus opciones y una herramienta por
 * vista). Cada herramienta tiene un campo «Nota» (para comprobar que nada se vuelve a montar) y un diálogo (para
 * comprobar que su Escape no cierra la herramienta). Mide cuánto tarda la cámara en llegar (<html data-viaje>, ms).
 */

const NAMES: Record<string, string> = { azul: "Caja azul", morado: "Caja morada", menta: "Caja menta", mesa: "La mesa" };

function LabTool({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-extrabold text-white">{name}</h2>
      <label className="block space-y-1.5 text-sm font-semibold text-slate-200">
        <span>Nota</span>
        <input name="nota" autoComplete="off" className="min-h-[44px] w-full rounded-xl border border-white/15 bg-night-900 px-3 text-base text-white" />
      </label>
      <button type="button" className="btn-ghost min-h-[44px] px-4" onClick={() => setOpen(true)}>
        Ver detalle
      </button>
      {open && (
        <Modal label="Detalle de la caja" onClose={() => setOpen(false)} className="flex items-center justify-center bg-night-950/70 p-4">
          <div className="surface max-w-sm space-y-3 p-5 text-slate-100">
            <p>Escape cierra este diálogo y la herramienta sigue abierta.</p>
            <button type="button" className="btn-primary min-h-[44px] px-4" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function LabSection() {
  const world = useWorld();
  const view = world?.view ?? "centro";
  const tool = view in NAMES ? view : null;
  const go = (v: string) => world?.go(v);

  // Cuánto tarda en llegar la cámara desde que cambia la vista (solo para medir)
  const t0 = useRef(0);
  useEffect(() => {
    t0.current = performance.now();
  }, [view]);
  useEffect(() => {
    if (world?.arrived && world.level > 0) document.documentElement.dataset.viaje = String(Math.round(performance.now() - t0.current));
  }, [world?.arrived, world?.level]);

  const options: StageOption[] = [
    { id: "azul", label: "Caja azul", hint: "Un campo y un diálogo para probar el foco", icon: "🟦", onSelect: () => go("azul") },
    { id: "morado", label: "Caja morada", hint: "Para pasar de una herramienta a otra", icon: "🟪", onSelect: () => go("morado") },
    { id: "menta", label: "Caja menta", hint: "Sin objeto en la escena: va a la bandeja", icon: "🟩", onSelect: () => go("menta") },
    { id: "mesa", label: "La mesa", hint: "Otra ruta, el mismo lienzo", icon: "🃏", href: "/laboratorio/mesa" },
  ];
  const lines = tool
    ? [`${NAMES[tool]}: escribe una nota y vuelve con Escape.`]
    : ["El laboratorio del motor: elige una caja.", "Arrastra para mirar alrededor; al soltar, la vista vuelve sola."];

  return (
    <WorldSectionStage id="laboratorio" video="bar" eyebrow="Laboratorio · motor V14" title="El laboratorio" lines={lines} options={options} active={tool} compact={!!tool}>
      {tool && <LabTool key={tool} name={NAMES[tool]} />}
    </WorldSectionStage>
  );
}
