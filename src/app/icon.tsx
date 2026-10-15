import { ImageResponse } from "next/og";
import { Moon } from "@/lib/og/brand";

/** Íconos PNG para el manifest de la PWA (Android pide PNG de 192 y 512). */
export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default function Icon({ id }: { id: string }) {
  const px = Number(id);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#07060A" }}>
      <Moon size={Math.round(px * 0.66)} />
    </div>,
    { width: px, height: px }
  );
}
