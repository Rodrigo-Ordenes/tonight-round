import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/brand";

export const alt = "Invitación a una sala de Tonight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function RoomOgImage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase().slice(0, 4);
  return new ImageResponse(
    <OgFrame eyebrow="Te invitaron a la sala" title={code === "SOLO" ? "Modo planificador" : `Sala ${code}`} subtitle="Toca para unirte desde el celular: votos, tragos, música y juegos en la TV." />,
    size
  );
}
