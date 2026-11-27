"use client";

import { type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Constantes de movimiento de la portada: un solo sistema (gsap-performance) */
const SCRUB = 1;
const POINTER_TRAVEL = 18; // px por unidad de profundidad al mover el puntero

/**
 * Movimiento de la portada, solo en el navegador y solo aquí (GSAP y Lenis no pesan en las demás rutas): scroll con
 * inercia (Lenis) con puntero fino de escritorio y el color de la noche `[data-night]`, que se enciende a medida que se
 * baja. La sala principal tiene su propio motor (ClubStage). Con prefers-reduced-motion no se crea nada.
 */
/**
 * Profundidad de la intro «La ronda»: las luces del bar al fondo, la barra con los vasos al medio y el logo eléctrico
 * adelante. Con el scroll cada capa se desplaza a su ritmo dentro del escenario fijo; en escritorio también siguen al
 * puntero. La intro aparece después de montar, por eso su propio hook atado a `active`.
 */
export function useIntroParallax(scope: RefObject<HTMLElement | null>, active: boolean) {
  useGSAP(
    () => {
      if (!active || !scope.current) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px) and (pointer: fine)",
        },
        (ctx) => {
          const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
          if (!motion) return;
          const section = scope.current;
          const whole = { trigger: section, start: "top top", end: "bottom bottom", scrub: SCRUB } as const;
          const layers = gsap.utils.toArray<HTMLElement>("[data-intro-depth]");
          for (const el of layers) {
            const depth = Number(el.dataset.introDepth ?? 0);
            gsap.fromTo(el, { yPercent: depth * 6 }, { yPercent: -depth * 6, ease: "none", scrollTrigger: whole });
          }

          // La contrabarra aparece cuando se apaga el logo (4–10 % de la intro) y se va antes del brindis (CLINK_AT 0.71),
          // así no compite con el logo ni con la tele del final. Línea de tiempo de duración 1 = avance de la intro.
          gsap
            .timeline({ scrollTrigger: whole })
            .fromTo("[data-backbar]", { opacity: 0 }, { opacity: 1, duration: 0.08, ease: "none" }, 0.06)
            .to("[data-backbar]", { opacity: 0, duration: 0.08, ease: "none" }, 0.58)
            .set({}, {}, 1);

          // Salida de la escena fijada: al soltarse el escenario, la barra se aleja y se apaga mientras llega el inicio
          // (la acción del final queda fuera de esta capa y no cambia)
          gsap.to("[data-intro-stage]", {
            scale: 0.9,
            yPercent: -4,
            opacity: 0.3,
            ease: "none",
            scrollTrigger: { trigger: section, start: "bottom bottom", end: "bottom top", scrub: SCRUB },
          });
          if (!desktop) return;
          const movers = layers.map((el) => {
            const depth = Number(el.dataset.introDepth ?? 0);
            return { depth, x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }) };
          });
          const onMove = (e: PointerEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            for (const m of movers) {
              m.x(nx * m.depth * POINTER_TRAVEL * 2);
              m.y(ny * m.depth * POINTER_TRAVEL);
            }
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          return () => window.removeEventListener("pointermove", onMove);
        }
      );
    },
    // Sin la intro a la vista no hay escenario que animar (y GSAP avisaría que el alcance no existe)
    { scope: active ? scope : undefined, dependencies: [active] }
  );
}

export function useHomeMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px) and (pointer: fine)",
        },
        (ctx) => {
          const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
          if (!motion) return;
          const cleanups: (() => void)[] = [];

          // Scroll con inercia en escritorio (en la sala lo ignora: ahí la rueda la maneja su propio motor)
          if (desktop) {
            const smooth = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
            smooth.on("scroll", ScrollTrigger.update);
            const tick = (time: number) => smooth.raf(time * 1000);
            gsap.ticker.add(tick);
            gsap.ticker.lagSmoothing(0);
            cleanups.push(() => {
              gsap.ticker.remove(tick);
              smooth.destroy();
            });
          }

          // Color de la noche: de azul a morado mientras se baja por la portada
          gsap.to("[data-night]", {
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: "#inicio", start: "top center", end: "max", scrub: SCRUB },
          });

          // Las fuentes y la intro «La ronda» (aparece después de montar) cambian el alto: se recalcula cada vez
          void document.fonts.ready.then(() => ScrollTrigger.refresh());
          let lastHeight = 0;
          let pending = 0;
          const ro = new ResizeObserver(() => {
            const h = scope.current?.offsetHeight ?? 0;
            if (h === lastHeight || pending) return;
            lastHeight = h;
            pending = requestAnimationFrame(() => {
              pending = 0;
              ScrollTrigger.refresh();
            });
          });
          if (scope.current) ro.observe(scope.current);
          cleanups.push(() => {
            ro.disconnect();
            cancelAnimationFrame(pending);
          });

          return () => cleanups.forEach((fn) => fn());
        }
      );
    },
    { scope }
  );
}
