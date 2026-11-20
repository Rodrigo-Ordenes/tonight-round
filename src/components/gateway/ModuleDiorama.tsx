import React from "react";

export type ModuleKey = "armar" | "bar" | "juegos" | "musica" | "dividir";
type Variant = "track" | "stack" | "header";
type Scene = { far: React.ReactNode; mid: React.ReactNode; near: React.ReactNode };

/* Colores de la paleta Neón (tailwind.config.js): azul neón, morado uv, menta y ámbar sobre la penumbra */
const BLUE = "#67AAFF";
const BLUE_SOFT = "#89BDFF";
const UV = "#B93EF3";
const UV_SOFT = "#D793FF";
const MINT = "#8CE3BE";
const INK = "#ECECF1";
const NIGHT = "rgba(19,19,24,0.9)";

/**
 * Escenas de los módulos en tres planos (fondo, medio y primer plano). Ninguna lleva montos ni cifras de alcohol:
 * se mueven, y esas cifras no se animan.
 */
const SCENES: Record<ModuleKey, Scene> = {
  armar: {
    far: (
      <svg viewBox="0 0 220 220" className="h-full w-full" fill="none">
        <circle cx="130" cy="100" r="74" stroke={BLUE} strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="130" cy="100" r="50" stroke={BLUE} strokeOpacity="0.35" />
        {/* Etiqueta de precio con código de barras (sin cifras) */}
        <g transform="translate(18 34) rotate(-8 40 18)">
          <path d="M0 6 Q0 0 6 0 H64 L80 18 L64 36 H6 Q0 36 0 30 Z" stroke={BLUE_SOFT} strokeWidth="1.5" fill="rgba(19,19,24,0.75)" />
          <circle cx="66" cy="18" r="3" stroke={BLUE_SOFT} strokeWidth="1.4" />
          <path d="M11 10 V26 M15 10 V26 M18 10 V26 M23 10 V26 M27 10 V26 M32 10 V26 M35 10 V26 M40 10 V26 M45 10 V26 M48 10 V26" stroke={BLUE_SOFT} strokeWidth="1.6" />
        </g>
      </svg>
    ),
    mid: (
      <svg viewBox="0 0 240 240" className="h-full w-full" fill="none">
        <g transform="translate(86 26) rotate(-8 30 80)">
          <rect x="20" y="6" width="16" height="26" rx="4" stroke={BLUE} strokeWidth="2" fill="rgba(103,170,255,0.12)" />
          <rect x="8" y="30" width="40" height="106" rx="12" stroke={BLUE} strokeWidth="2" fill={NIGHT} />
          <rect x="14" y="62" width="28" height="36" rx="5" stroke={UV} strokeWidth="1.6" fill="rgba(185,62,243,0.18)" />
        </g>
        <g transform="translate(142 36) rotate(7 26 70)">
          <rect x="18" y="8" width="14" height="22" rx="3" stroke={MINT} strokeWidth="2" fill="rgba(140,227,190,0.14)" />
          <rect x="6" y="28" width="38" height="98" rx="12" stroke={MINT} strokeWidth="2" fill={NIGHT} />
          <path d="M12 72 H38" stroke={MINT} strokeWidth="2" />
        </g>
        {/* Jaba */}
        <rect x="52" y="126" width="148" height="72" rx="16" stroke={BLUE} strokeWidth="2.2" fill="rgba(19,19,24,0.94)" />
        <path d="M74 148 H178 M74 172 H178" stroke="rgba(103,170,255,0.35)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    near: (
      <svg viewBox="0 0 180 110" className="h-full w-full" fill="none">
        <rect x="14" y="26" width="146" height="46" rx="14" stroke={MINT} strokeWidth="1.8" fill="rgba(19,19,24,0.94)" />
        <circle cx="38" cy="49" r="9" fill="rgba(140,227,190,0.22)" stroke={MINT} strokeWidth="1.8" />
        <path d="M34 49 L37 52 L43 45" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="56" y="54" fill={INK} fontSize="13" fontFamily="sans-serif" fontWeight="700">
          Hielo y agua
        </text>
      </svg>
    ),
  },
  bar: {
    far: (
      <svg viewBox="0 0 220 220" className="h-full w-full" fill="none">
        <circle cx="140" cy="84" r="56" stroke={UV} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.55" />
        <circle cx="140" cy="84" r="38" stroke={BLUE} strokeWidth="1.2" opacity="0.45" />
        <path d="M140 46 V122 M102 84 H178 M113 57 L167 111 M167 57 L113 111" stroke={BLUE} strokeWidth="1" opacity="0.35" />
      </svg>
    ),
    mid: (
      // Una piscola de verdad: bebida cola oscura con su reflejo, hielo, burbujas y un gajo de limón en el borde
      <svg viewBox="0 0 240 240" className="h-full w-full" fill="none">
        <path d="M72 44 L84 198 C85 206 92 212 100 212 H156 C164 212 171 206 172 198 L184 44 Z" stroke={BLUE} strokeWidth="2.4" fill={NIGHT} />
        <path d="M77.5 76 L178.5 76 L169.5 196 C168.6 201 163 205 156 205 H100 C93 205 87.4 201 86.5 196 Z" fill="#3E1F0D" />
        <path d="M88 84 L96 196" stroke="rgba(255,190,120,0.22)" strokeWidth="9" strokeLinecap="round" />
        <path d="M168 84 L161 194" stroke="rgba(0,0,0,0.35)" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="128" cy="76" rx="50" ry="5" fill="#6B3A1C" stroke="rgba(255,255,255,0.25)" />
        <g stroke="rgba(255,255,255,0.7)" strokeWidth="1.2">
          <rect x="104" y="66" width="24" height="24" rx="5" transform="rotate(-12 116 78)" fill="rgba(255,255,255,0.22)" />
          <rect x="132" y="96" width="22" height="22" rx="5" transform="rotate(16 143 107)" fill="rgba(255,255,255,0.16)" />
          <rect x="106" y="128" width="22" height="22" rx="5" transform="rotate(8 117 139)" fill="rgba(255,255,255,0.13)" />
        </g>
        {[[118, 186, 2], [136, 170, 1.5], [152, 150, 1.8], [110, 112, 1.3], [144, 128, 1.2]].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        ))}
        <g transform="translate(180 46) rotate(-28)">
          <path d="M-16 0 A16 16 0 0 1 16 0 Z" fill="#5E9E22" />
          <path d="M-13.5 0 A13.5 13.5 0 0 1 13.5 0 Z" fill="#CDE86A" stroke="#F2F8D5" strokeWidth="1.2" />
        </g>
      </svg>
    ),
    near: (
      <svg viewBox="0 0 150 140" className="h-full w-full" fill="none">
        {/* Cubos de hielo: translúcidos, con el canto iluminado */}
        <rect x="34" y="28" width="38" height="38" rx="7" transform="rotate(-14 53 47)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" fill="rgba(201,224,255,0.22)" />
        <path d="M40 36 L44 58 M40 36 L62 32" transform="rotate(-14 53 47)" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        <rect x="74" y="48" width="34" height="34" rx="6" transform="rotate(18 91 65)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" fill="rgba(201,224,255,0.16)" />
        <circle cx="52" cy="104" r="5" fill={MINT} />
        <circle cx="88" cy="114" r="3.5" fill={BLUE_SOFT} />
        <circle cx="106" cy="24" r="4" fill={UV_SOFT} />
      </svg>
    ),
  },
  juegos: {
    far: (
      <svg viewBox="0 0 220 220" className="h-full w-full" fill="none">
        <circle cx="120" cy="110" r="78" stroke={UV} strokeWidth="2" strokeDasharray="10 6" />
        <circle cx="120" cy="110" r="52" stroke={BLUE} strokeWidth="1.5" />
        <circle cx="120" cy="110" r="22" stroke={MINT} strokeWidth="2" fill="rgba(140,227,190,0.15)" />
        <path d="M120 24 L126 42 H114 Z" fill={MINT} />
      </svg>
    ),
    mid: (
      <svg viewBox="0 0 230 230" className="h-full w-full" fill="none">
        <g transform="translate(62 46) rotate(-14 48 68)">
          <rect x="0" y="0" width="88" height="126" rx="14" stroke={BLUE} strokeWidth="2" fill={NIGHT} />
          <text x="18" y="30" fill={BLUE_SOFT} fontSize="18" fontWeight="800" fontFamily="monospace">
            A♠
          </text>
        </g>
        <g transform="translate(96 42) rotate(10 48 68)">
          <rect x="0" y="0" width="88" height="126" rx="14" stroke={UV} strokeWidth="2.2" fill="rgba(19,19,24,0.94)" />
          <text x="18" y="30" fill={UV_SOFT} fontSize="18" fontWeight="800" fontFamily="monospace">
            K♥
          </text>
          <circle cx="44" cy="68" r="18" stroke={MINT} strokeWidth="2" fill="rgba(140,227,190,0.16)" />
        </g>
      </svg>
    ),
    near: (
      <svg viewBox="0 0 170 130" className="h-full w-full" fill="none">
        <g transform="translate(20 22) rotate(12 32 32)">
          <rect x="0" y="0" width="64" height="64" rx="16" stroke={MINT} strokeWidth="2.2" fill="rgba(19,19,24,0.95)" />
          <circle cx="20" cy="20" r="4.5" fill={MINT} />
          <circle cx="44" cy="20" r="4.5" fill={MINT} />
          <circle cx="32" cy="32" r="4.5" fill={UV_SOFT} />
          <circle cx="20" cy="44" r="4.5" fill={MINT} />
          <circle cx="44" cy="44" r="4.5" fill={MINT} />
        </g>
        <rect x="92" y="14" width="68" height="32" rx="16" stroke={UV} strokeWidth="1.8" fill="rgba(185,62,243,0.22)" />
        <text x="126" y="35" textAnchor="middle" fill={INK} fontSize="13" fontFamily="monospace" fontWeight="800">
          +20 PTS
        </text>
      </svg>
    ),
  },
  musica: {
    far: (
      <svg viewBox="0 0 220 180" className="h-full w-full" fill="none">
        {[44, 88, 62, 112, 74, 96, 54, 82].map((h, i) => (
          <rect key={i} x={28 + i * 24} y={140 - h} width="10" height={h} rx="5" fill={i % 2 === 0 ? "rgba(103,170,255,0.35)" : "rgba(185,62,243,0.35)"} />
        ))}
      </svg>
    ),
    mid: (
      <svg viewBox="0 0 240 240" className="h-full w-full" fill="none">
        <circle cx="126" cy="126" r="88" stroke={BLUE} strokeWidth="2.2" fill="rgba(14,14,19,0.94)" />
        <circle cx="126" cy="126" r="70" stroke="rgba(236,236,241,0.14)" strokeWidth="1.2" />
        <circle cx="126" cy="126" r="54" stroke="rgba(185,62,243,0.35)" strokeWidth="1.4" strokeDasharray="18 10" />
        <circle cx="126" cy="126" r="30" stroke={UV} strokeWidth="2" fill="rgba(185,62,243,0.22)" />
        <circle cx="126" cy="126" r="8" fill="#090A0D" stroke={MINT} strokeWidth="2" />
      </svg>
    ),
    near: (
      <svg viewBox="0 0 180 110" className="h-full w-full" fill="none">
        <rect x="12" y="30" width="156" height="46" rx="23" stroke={BLUE} strokeWidth="1.8" fill="rgba(19,19,24,0.94)" />
        <circle cx="38" cy="53" r="6" fill={MINT} />
        <text x="54" y="58" fill={INK} fontSize="13" fontFamily="sans-serif" fontWeight="700">
          Cola en vivo · ▲ 8
        </text>
      </svg>
    ),
  },
  dividir: {
    far: (
      <svg viewBox="0 0 220 200" className="h-full w-full" fill="none">
        <path d="M46 60 Q110 20 174 74" stroke={BLUE} strokeWidth="1.6" strokeDasharray="4 4" />
        <path d="M58 134 Q118 164 174 74" stroke={MINT} strokeWidth="1.6" strokeDasharray="4 4" />
        <circle cx="46" cy="60" r="14" stroke={BLUE} strokeWidth="1.8" fill={NIGHT} />
        <circle cx="58" cy="134" r="14" stroke={UV} strokeWidth="1.8" fill={NIGHT} />
        <circle cx="174" cy="74" r="18" stroke={MINT} strokeWidth="2" fill="rgba(140,227,190,0.18)" />
      </svg>
    ),
    mid: (
      <svg viewBox="0 0 220 240" className="h-full w-full" fill="none">
        {/* Boleta térmica dentada: renglones sin montos y el visto de cuentas claras */}
        <g transform="translate(48 24) rotate(-6 64 96)">
          <path d="M8 0 H128 V184 L118 176 L108 184 L98 176 L88 184 L78 176 L68 184 L58 176 L48 184 L38 176 L28 184 L18 176 L8 184 Z" stroke={BLUE} strokeWidth="2" fill="rgba(19,19,24,0.94)" />
          <path d="M24 34 H112 M24 58 H88 M24 82 H112 M24 106 H96" stroke="rgba(236,236,241,0.28)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="98" cy="144" r="14" stroke={MINT} strokeWidth="2" fill="rgba(140,227,190,0.14)" />
          <path d="M91 144 L96 149 L105 139" stroke={MINT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    ),
    near: (
      <svg viewBox="0 0 185 110" className="h-full w-full" fill="none">
        <rect x="10" y="28" width="164" height="46" rx="14" stroke={MINT} strokeWidth="1.8" fill="rgba(19,19,24,0.95)" />
        <text x="92" y="56" textAnchor="middle" fill={MINT} fontSize="13" fontFamily="monospace" fontWeight="800">
          CONDUCTOR EXENTO
        </text>
      </svg>
    ),
  },
};

/** Dónde va cada plano según el lugar: tarjeta del recorrido, carta apilada del celular o cabecera de sección */
const LAYOUT: Record<Variant, { box: string; far: string; mid: string; near: string }> = {
  track: {
    box: "pointer-events-none absolute inset-0 overflow-hidden",
    far: "absolute -right-6 top-6 h-56 w-56 opacity-50",
    mid: "absolute -bottom-6 -right-4 h-64 w-64 opacity-80",
    near: "absolute bottom-20 right-8 h-32 w-48",
  },
  // En la carta apilada el texto ocupa todo el ancho: va sin el primer plano (sus píldoras con texto tapaban la
  // descripción); el ícono que flota hace de plano cercano
  stack: {
    box: "pointer-events-none absolute inset-y-0 right-0 w-[60%] overflow-hidden [mask-image:linear-gradient(to_left,#000_35%,transparent)]",
    far: "diorama-rise-far absolute -right-8 -top-8 h-40 w-40 opacity-40",
    mid: "diorama-rise-mid absolute -bottom-14 -right-6 h-44 w-44 opacity-55",
    near: "hidden",
  },
  header: {
    box: "pointer-events-none absolute -top-4 right-0 -z-10 h-36 w-40 opacity-70 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] sm:h-48 sm:w-56 lg:-top-8 lg:h-60 lg:w-72 lg:opacity-100",
    far: "parallax-deep absolute right-0 top-0 h-[72%] w-[72%] opacity-60",
    mid: "parallax-mid absolute bottom-0 right-[10%] h-[86%] w-[86%] opacity-80",
    near: "parallax-near absolute bottom-[14%] right-0 h-[36%] w-[60%]",
  },
};

/**
 * Diorama en tres planos de un módulo. En el recorrido de escritorio cada plano lleva su profundidad para GSAP
 * (`data-panel-depth` con el scroll, `data-diorama-layer` con el puntero); en el celular se arma con el scroll en
 * CSS, y en las cabeceras usa el parallax de toda la app. Decorativo: oculto para lectores de pantalla.
 */
export default function ModuleDiorama({ id, variant = "track" }: { id: ModuleKey; variant?: Variant }) {
  const scene = SCENES[id];
  const l = LAYOUT[variant];
  if (variant === "track") {
    return (
      <div aria-hidden className={l.box}>
        <div data-panel-depth="0.35" className={l.far}>
          <div data-diorama-layer="0.4" className="h-full w-full">
            {scene.far}
          </div>
        </div>
        <div data-panel-depth="0.8" className={l.mid}>
          <div data-diorama-layer="0.9" className="h-full w-full">
            {scene.mid}
          </div>
        </div>
        <div data-panel-depth="1.25" className={l.near}>
          <div data-diorama-layer="1.35" className="h-full w-full">
            {scene.near}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden className={l.box}>
      <div className={l.far}>{scene.far}</div>
      <div className={l.mid}>{scene.mid}</div>
      {l.near !== "hidden" && <div className={l.near}>{scene.near}</div>}
    </div>
  );
}
