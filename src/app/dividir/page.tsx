import { redirect } from "next/navigation";

/** La cuenta vive ahora dentro de la compra (apartado Sala): la ruta antigua lleva directo a ella */
export default function DividirPage() {
  redirect("/armar?ver=cuenta");
}
