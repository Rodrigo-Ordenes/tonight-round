import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import DisclaimerModal from "@/components/ui/DisclaimerModal";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Tonight — el copiloto de tu carrete",
  description:
    "Arma la previa, prepara tragos, juega con la TV y los celulares, pon la música y divide la cuenta. Gratis, sin cuentas y en Chile, México, EE.UU. y Japón.",
  applicationName: "Tonight",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tonight",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07060A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-night-950 text-slate-100 font-sans antialiased overflow-x-hidden">
        <div aria-hidden className="ambient" />
        <div aria-hidden className="grain" />
        <AppShell>{children}</AppShell>
        <DisclaimerModal />
      </body>
    </html>
  );
}
