/* Piezas compartidas para las imágenes generadas (OG, íconos). Solo estilos en línea: las renderiza Satori. */
import React from "react";

export const OG_COLORS = { bg: "#07060A", text: "#F7F5F3", muted: "#BAB4C2", ember: "#FF5E36", iris: "#9C82FF", lime: "#86E64C" };

export function Moon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="m" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD2C2" />
          <stop offset="0.5" stopColor="#FF5E36" />
          <stop offset="1" stopColor="#9C82FF" />
        </linearGradient>
      </defs>
      <path d="M20.5 3.5A12.5 12.5 0 1 0 28.5 22 10 10 0 0 1 20.5 3.5Z" fill="url(#m)" />
      <circle cx="24.5" cy="8.5" r="1.6" fill="#86E64C" />
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
        backgroundImage: "radial-gradient(circle at 10% 0%, rgba(255,94,54,0.45), transparent 55%), radial-gradient(circle at 95% 100%, rgba(156,130,255,0.45), transparent 55%)",
        color: OG_COLORS.text,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Moon size={64} />
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
