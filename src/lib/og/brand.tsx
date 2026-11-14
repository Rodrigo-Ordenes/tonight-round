/* Piezas compartidas para las imágenes generadas (OG, íconos). Solo estilos en línea: las renderiza Satori. */
import React from "react";

export const OG_COLORS = { bg: "#090A0D", text: "#ECECF1", muted: "#BCBDC4", blue: "#67AAFF", violet: "#CA68FF", signal: "#8CE3BE" };

export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(16 8.5 20)" stroke={OG_COLORS.blue} strokeWidth="2.2">
        <path d="M5 5 C5 12 6.5 16 8.5 16 C10.5 16 12 12 12 5" />
        <path d="M5.6 9 H11.4" strokeOpacity={0.7} />
        <path d="M8.5 16 V25 M5.5 25.5 H11.5" />
      </g>
      <g transform="rotate(-16 23.5 20)" stroke={OG_COLORS.violet} strokeWidth="2.2">
        <path d="M20 5 C20 12 21.5 16 23.5 16 C25.5 16 27 12 27 5" />
        <path d="M20.6 9 H26.4" strokeOpacity={0.7} />
        <path d="M23.5 16 V25 M20.5 25.5 H26.5" />
      </g>
      <path d="M16 0.8 V3.8 M12.8 2 L14.3 4.2 M19.2 2 L17.7 4.2" stroke={OG_COLORS.signal} strokeWidth="1.8" />
    </svg>
  );
}

export function OgFrame({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: OG_COLORS.bg,
        backgroundImage: "radial-gradient(circle at 12% 0%, rgba(103, 170, 255, 0.28), transparent 50%), radial-gradient(rgba(236, 236, 241, 0.09) 1.5px, transparent 1.5px)",
        backgroundSize: "100% 100%, 28px 28px",
        color: OG_COLORS.text,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={64} />
        <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8 }}>TONIGHT</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ fontSize: 28, color: OG_COLORS.muted, letterSpacing: 6, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{title}</span>
        <span style={{ fontSize: 34, color: OG_COLORS.muted }}>{subtitle}</span>
      </div>
    </div>
  );
}
