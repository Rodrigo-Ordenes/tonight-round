"use client";

import React, { useEffect, useLayoutEffect } from "react";
import SectionStage from "@/components/rooms/SectionStage";
import HostSays from "@/components/rooms/HostSays";
import { warmAudio } from "@/components/rooms/sfx";
import { rememberZone, ZONAS_CLUB } from "@/components/gateway/club3d/zonas";
import { useWorld } from "./WorldProvider";
import { ObjectLayer } from "./ObjectLayer";
import { ToolSlot } from "./ToolSlot";

type Props = React.ComponentProps<typeof SectionStage>;

/*
 * El mismo contrato que SectionStage, con dos caras. Sin mundo (o en el nivel 0) es SectionStage tal cual: el DOM, las
 * entradas y los nombres de hoy. Con el 3D a la vista: el título y el host arriba (LLEGAR, MIRAR), cada opción como
 * un botón real sobre su objeto (ELEGIR), y la herramienta montada sobre el objeto al llegar la cámara (ACERCARSE,
 * USAR), con la tira de opciones y «Volver» arriba (VOLVER). Una herramienta está abierta cuando la vista está
 * recogida (`compact`) y hay una opción activa: así se usa hoy en el bar y en la compra.
 */
export default function WorldSectionStage(props: Props) {
  const world = useWorld();
  if (!world || world.level === 0) return <SectionStage {...props} />;
  return <WorldStage {...props} />;
}

function WorldStage({ id, eyebrow, title, lines, options = [], active, compact = false, sound = "clink", theme = "neon", aside, children }: Props) {
  const world = useWorld()!;
  const { bus } = world;
  const toolOpen = compact && active != null;
  const activeOption = options.find((o) => o.id === active);

  // El lienzo lee en cada cuadro si hay herramienta abierta y de qué objeto (para el marco y para no MIRAR)
  useLayoutEffect(() => {
    bus.tool.open = toolOpen;
    bus.tool.id = toolOpen ? (active ?? null) : null;
    bus.measure();
  }, [toolOpen, active, bus]);
  useEffect(
    () => () => {
      bus.tool.open = false;
      bus.tool.id = null;
    },
    [bus],
  );
  // Como SectionStage: recordar la zona para volver a ella desde el club y preparar el sonido
  useEffect(() => {
    const z = ZONAS_CLUB.find((x) => x.id === id);
    if (z) rememberZone(z.id);
    warmAudio();
  }, [id]);

  const casino = theme === "casino";
  const host = <HostSays lines={lines} size="sm" tone={theme} />;
  return (
    <>
      <section aria-labelledby={`${id}-title`} data-room={id} data-mundo="" className={casino ? "theme-casino" : undefined}>
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-20 mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:top-24 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            {/* Con la herramienta abierta el título se aparta de la vista, pero sigue siendo el h1 de la página */}
            <div className={toolOpen ? "sr-only" : "max-w-2xl"}>
              <p className={`eyebrow ${casino ? "!text-[#ECC85F]" : ""}`}>{eyebrow}</p>
              <h1 id={`${id}-title`} className={`display mt-1 text-[2rem] leading-[1.02] sm:text-5xl ${casino ? "casino-title" : ""}`}>
                {title}
                <span className={casino ? "" : "text-accent"}>.</span>
              </h1>
            </div>
            {aside && !toolOpen && <div className="pointer-events-auto">{aside}</div>}
          </div>
          {!toolOpen && <div className="pointer-events-auto w-fit max-w-full">{host}</div>}
        </div>
        <ObjectLayer title={title} options={options} active={active} toolOpen={toolOpen} theme={theme} sound={sound} />
      </section>
      {(toolOpen || children) && (
        <ToolSlot key="herramienta" mode={toolOpen ? "marco" : "debajo"} label={activeOption?.label ?? title} theme={theme} host={toolOpen ? host : undefined}>
          {children}
        </ToolSlot>
      )}
    </>
  );
}
