import type { Metadata } from "next";

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const code = params.code.toUpperCase();
  const title = code === "SOLO" ? "Modo planificador · Tonight" : `Sala ${code} · Tonight`;
  return {
    title,
    description: "Únete desde el celular: juegos en la TV con votos secretos, tragos, agua, música y cuentas claras.",
    openGraph: { title, description: "Te invitaron a un carrete en Tonight. Toca para unirte." },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
