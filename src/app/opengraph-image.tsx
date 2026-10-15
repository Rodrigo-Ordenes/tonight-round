import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/brand";

export const alt = "Tonight — el copiloto de tu carrete";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <OgFrame eyebrow="Gratis · sin cuentas · CL MX US JP" title="La noche se arma acá." subtitle="Compras, tragos, juegos en la TV, música y cuentas claras." />,
    size
  );
}
