"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Constantes de movimiento de la portada: un solo sistema (gsap-performance) */
const SCRUB = 1;
const EASE_OUT = "power4.out";
const DEPTH_TRAVEL = 30; // yPercent por unidad de profundidad al recorrer el hero
const POINTER_TRAVEL = 18; // px por unidad de profundidad al mover el puntero
const MAX_SKEW = 4; // grados máximos de inclinación de las tarjetas según la velocidad del scroll
const MAX_TILT = 6.5; // grados máximos de inclinación 3D de una tarjeta del recorrido hacia el puntero
const DIORAMA_TRAVEL = 24; // xPercent por unidad de profundidad de un plano del diorama a lo largo del recorrido
const LAYER_POINTER = 26; // px por unidad de profundidad de un plano del diorama al mover el puntero
const TILT_EASE = { duration: 0.5, ease: "power3.out" } as const;

/**
 * Movimiento de la portada (escenas tipo Awwwards), solo en el navegador y solo aquí, así GSAP y Lenis no pesan en
 * las demás rutas:
 * - Scroll con inercia (Lenis) con puntero fino de escritorio; en táctil queda el gesto nativo.
 * - Hero en capas `[data-depth]`: se desplazan con el scroll (scrub suavizado) y, en escritorio, siguen al puntero.
 * - Título por palabras con máscara (SplitText deja el texto accesible).
 * - Módulos `[data-track]`: recorrido horizontal fijado en escritorio, con dioramas en tres planos que lo cruzan a
 *   distinto ritmo y tarjetas que se inclinan hacia el puntero.
 * - Color de la noche `[data-night]`: se enciende a medida que se baja.
 * Con prefers-reduced-motion no se crea nada: la página queda quieta y completa.
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
    { scope, dependencies: [active] }
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

          let lenis: Lenis | null = null;
          if (desktop) {
            // gestureOrientation "both": deslizar de lado en el trackpad también avanza (así el recorrido de módulos
            // responde al gesto que uno intenta primero)
            lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, gestureOrientation: "both" });
            const smooth = lenis;
            smooth.on("scroll", ScrollTrigger.update);
            const tick = (time: number) => smooth.raf(time * 1000);
            gsap.ticker.add(tick);
            gsap.ticker.lagSmoothing(0);
            cleanups.push(() => {
              gsap.ticker.remove(tick);
              smooth.destroy();
            });
          }

          // Título: palabras que suben desde una máscara, en ola, cuando el inicio entra a la vista (con la intro delante,
          // antes se animaba escondido)
          const split = SplitText.create("[data-split]", { type: "words", mask: "words" });
          // Al terminar se deshace el corte: la máscara recortaba el brillo de neón de «acá.» en un rectángulo
          gsap.from(split.words, { yPercent: 110, duration: 0.9, ease: EASE_OUT, stagger: { each: 0.07, ease: "power2.in" }, delay: 0.1, onComplete: () => split.revert(), scrollTrigger: { trigger: "#inicio", start: "top 75%", once: true } });
          cleanups.push(() => split.revert());

          // Capas del hero: lo lejano se queda atrás, lo cercano se adelanta
          const layers = gsap.utils.toArray<HTMLElement>("[data-depth]");
          for (const el of layers) {
            const depth = Number(el.dataset.depth ?? 0);
            gsap.to(el, {
              yPercent: depth * DEPTH_TRAVEL,
              ease: "none",
              scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom top", scrub: SCRUB },
            });
          }

          if (desktop) {
            const movers = layers.map((el) => {
              const depth = Number(el.dataset.depth ?? 0);
              return {
                depth,
                x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
                y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
              };
            });
            const onMove = (e: PointerEvent) => {
              const nx = e.clientX / window.innerWidth - 0.5;
              const ny = e.clientY / window.innerHeight - 0.5;
              for (const m of movers) {
                m.x(-nx * m.depth * POINTER_TRAVEL * 2);
                m.y(-ny * m.depth * POINTER_TRAVEL);
              }
            };
            window.addEventListener("pointermove", onMove, { passive: true });
            cleanups.push(() => window.removeEventListener("pointermove", onMove));

            // Módulos: la noche pasa de lado mientras la sección queda fija
            const section = scope.current?.querySelector<HTMLElement>("[data-track-section]");
            const track = section?.querySelector<HTMLElement>("[data-track]");
            if (section && track && lenis) {
              // Las tarjetas se inclinan con la velocidad del scroll y vuelven a plomo al detenerse (máx. ±4°)
              const skews = gsap.utils.toArray<HTMLElement>("[data-track] > li").map((li) => gsap.quickTo(li, "skewX", { duration: 0.5, ease: "power3.out" }));
              const onVelocity = ({ velocity }: { velocity: number }) => {
                const skew = gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, -velocity * 0.1);
                for (const set of skews) set(skew);
              };
              lenis.on("scroll", onVelocity);
              cleanups.push(() => lenis?.off("scroll", onVelocity));
            }
            if (section && track) {
              // Fijado: el CSS deja la fila a su ancho natural (sin esto es una fila con scroll propio)
              section.dataset.pinned = "";
              cleanups.push(() => delete section.dataset.pinned);
              const cards = Array.from(track.children) as HTMLElement[];
              const count = section.querySelector<HTMLElement>("[data-track-count]");
              const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
              let shown = 0;
              // Tarjeta pedida con las flechas que aún no llega: los clics seguidos se suman desde ella
              let pending: number | null = null;
              const tween = gsap.to(track, {
                x: () => -distance(),
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: () => `+=${distance()}`,
                  pin: true,
                  scrub: SCRUB,
                  invalidateOnRefresh: true,
                  fastScrollEnd: true,
                  onUpdate: (self) => {
                    const i = Math.round(self.progress * (cards.length - 1));
                    if (i === pending) pending = null;
                    if (i !== shown && pending === null && count) count.textContent = String((shown = i) + 1).padStart(2, "0");
                    else shown = i;
                  },
                },
              });
              // Ir a una tarjeta: la posición de scroll que la deja a la vista dentro del tramo fijado
              const goTo = (i: number) => {
                const st = tween.scrollTrigger;
                if (!st) return;
                const target = st.start + (st.end - st.start) * (gsap.utils.clamp(0, cards.length - 1, i) / (cards.length - 1));
                if (lenis) lenis.scrollTo(target, { duration: 0.9 });
                else window.scrollTo({ top: target, behavior: "smooth" });
              };
              const onGo = (e: Event) => {
                const dir = (e as CustomEvent<number>).detail;
                e.preventDefault();
                pending = gsap.utils.clamp(0, cards.length - 1, (pending ?? shown) + dir);
                if (count) count.textContent = String(pending + 1).padStart(2, "0");
                goTo(pending);
              };
              // Con teclado: al llegar el foco a una tarjeta fuera de vista, el recorrido la trae
              const onFocus = (e: FocusEvent) => {
                const i = cards.findIndex((c) => c.contains(e.target as Node));
                if (i >= 0 && i !== shown) goTo(i);
              };
              section.addEventListener("track:go", onGo);
              track.addEventListener("focusin", onFocus);
              cleanups.push(() => {
                section.removeEventListener("track:go", onGo);
                track.removeEventListener("focusin", onFocus);
              });
              // Dioramas en tres planos: a lo largo del recorrido cada plano cruza su tarjeta a su ritmo (lo cercano viaja
              // más y se inclina un poco). Una sola línea de tiempo para los quince planos, atada al mismo tramo fijado.
              const dioramas = gsap.timeline({
                scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, scrub: SCRUB, invalidateOnRefresh: true },
              });
              for (const layer of gsap.utils.toArray<HTMLElement>("[data-panel-depth]")) {
                const d = Number(layer.dataset.panelDepth ?? 0.5);
                dioramas.fromTo(
                  layer,
                  { xPercent: DIORAMA_TRAVEL * d, yPercent: -8 * d, rotation: -4 * d },
                  { xPercent: -DIORAMA_TRAVEL * d, yPercent: 8 * d, rotation: 4 * d, ease: "none" },
                  0
                );
              }

              // Tarjeta que se inclina hacia el puntero (21st «3D Glare Card»): rota con perspectiva, sus planos se separan
              // según la profundidad y un reflejo llega hasta el puntero. Todo con transform vía quickTo.
              for (const card of gsap.utils.toArray<HTMLElement>("[data-tilt-card]")) {
                gsap.set(card, { transformPerspective: 1100 });
                const rotX = gsap.quickTo(card, "rotationX", TILT_EASE);
                const rotY = gsap.quickTo(card, "rotationY", TILT_EASE);
                const glare = card.querySelector<HTMLElement>("[data-tilt-glare]");
                const glareX = glare && gsap.quickTo(glare, "x", TILT_EASE);
                const glareY = glare && gsap.quickTo(glare, "y", TILT_EASE);
                const planes = Array.from(card.querySelectorAll<HTMLElement>("[data-diorama-layer]")).map((el) => ({
                  depth: Number(el.dataset.dioramaLayer ?? 1),
                  x: gsap.quickTo(el, "x", TILT_EASE),
                  y: gsap.quickTo(el, "y", TILT_EASE),
                }));
                const onCardMove = (e: PointerEvent) => {
                  if (e.pointerType === "touch") return;
                  const r = card.getBoundingClientRect();
                  if (!r.width || !r.height) return;
                  const nx = (e.clientX - r.left) / r.width - 0.5;
                  const ny = (e.clientY - r.top) / r.height - 0.5;
                  rotX(-ny * MAX_TILT * 2);
                  rotY(nx * MAX_TILT * 2);
                  if (glare && glareX && glareY) {
                    glareX(e.clientX - r.left - glare.offsetWidth / 2);
                    glareY(e.clientY - r.top - glare.offsetHeight / 2);
                  }
                  for (const p of planes) {
                    p.x(nx * LAYER_POINTER * p.depth);
                    p.y(ny * LAYER_POINTER * 0.8 * p.depth);
                  }
                };
                const onCardEnter = () => glare && gsap.to(glare, { opacity: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
                const onCardLeave = () => {
                  rotX(0);
                  rotY(0);
                  for (const p of planes) {
                    p.x(0);
                    p.y(0);
                  }
                  if (glare) gsap.to(glare, { opacity: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
                };
                card.addEventListener("pointermove", onCardMove, { passive: true });
                card.addEventListener("pointerenter", onCardEnter, { passive: true });
                card.addEventListener("pointerleave", onCardLeave, { passive: true });
                cleanups.push(() => {
                  card.removeEventListener("pointermove", onCardMove);
                  card.removeEventListener("pointerenter", onCardEnter);
                  card.removeEventListener("pointerleave", onCardLeave);
                });
              }
            }
          }

          // Color de la noche: de azul a morado mientras se baja por la portada
          gsap.to("[data-night]", {
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: "#inicio", start: "top center", end: "max", scrub: SCRUB },
          });

          // Las fuentes y la intro «La ronda» (aparece después de montar y suma 480vh) cambian el alto: sin recalcular,
          // el recorrido fijado queda calculado arriba y tapa la intro. Se recalcula cada vez que cambia el alto.
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

/**
 * Flechas y contador del recorrido de módulos. Las flechas piden avanzar con un evento; si el recorrido está fijado
 * (useHomeMotion) lo atiende GSAP, y si no, se desplaza la fila con su scroll horizontal propio.
 */
export function useTrackNav(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = scope.current?.querySelector<HTMLElement>("[data-track-section]");
    const track = section?.querySelector<HTMLElement>("[data-track]");
    if (!section || !track) return;
    const count = section.querySelector<HTMLElement>("[data-track-count]");
    const step = () => {
      const first = track.children[0] as HTMLElement | undefined;
      return first ? first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0") : track.clientWidth;
    };
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-track-go]");
      if (!btn) return;
      const dir = btn.dataset.trackGo === "prev" ? -1 : 1;
      const handled = !section.dispatchEvent(new CustomEvent("track:go", { detail: dir, cancelable: true }));
      if (!handled) track.scrollBy({ left: dir * step(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    const onScroll = () => {
      if (section.hasAttribute("data-pinned") || !count) return;
      count.textContent = String(Math.round(track.scrollLeft / step()) + 1).padStart(2, "0");
    };
    section.addEventListener("click", onClick);
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      section.removeEventListener("click", onClick);
      track.removeEventListener("scroll", onScroll);
    };
  }, [scope]);
}
