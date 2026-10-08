import type { Metadata, Viewport } from "next";
import "./globals.css";
import GlobalNavbar from "@/components/navigation/GlobalNavbar";
import DisclaimerModal from "@/components/ui/DisclaimerModal";
import HalloweenBanner from "@/components/theme/HalloweenBanner";

export const metadata: Metadata = {
  title: "Tonight | Copiloto del Carrete V8 🇨🇱",
  description:
    "Web app gratuita, mobile-first y optimizada para Smart TV para armar carretes, cotizar multitienda, monitorear consumo con el Monstruómetro y cuidar al conductor designado.",
  applicationName: "Tonight",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tonight",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-night-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        <div className="min-h-[100dvh] flex flex-col overflow-x-hidden">
          <HalloweenBanner />
          <GlobalNavbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-4 pb-[calc(88px+env(safe-area-inset-bottom,16px))] md:pb-12">
            {children}
          </main>
          <DisclaimerModal />
        </div>
      </body>
    </html>
  );
}
