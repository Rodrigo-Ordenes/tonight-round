import { Car, ShieldAlert } from "lucide-react";

/** Estado del conductor designado con texto e ícono: nunca solo con color. */
export default function DriverStatus({ breach, className = "" }: { breach: boolean; className?: string }) {
  const Icon = breach ? ShieldAlert : Car;
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${breach ? "text-rose-300" : "text-emerald-200"} ${className}`}>
      <Icon className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden />
      {breach ? "Conductor tomó · busquen otro" : "Conductor · sin alcohol"}
    </span>
  );
}
