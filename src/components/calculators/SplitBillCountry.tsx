"use client";

import SplitBill from "./SplitBill";

/**
 * SplitBillCountry: Componente de división de cuenta y cobro adaptado
 * dinámicamente según el país activo (CuentaRUT / SPEI CLABE / Venmo / PayPay).
 */
export default function SplitBillCountry() {
  return <SplitBill />;
}

export { SplitBill as SplitBillComponent };
