import { ImageResponse } from "next/og";
import { Moon } from "@/lib/og/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#07060A" }}>
      <Moon size={120} />
    </div>,
    size
  );
}
