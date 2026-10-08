"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function SalaCodeRedirect() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = typeof params.code === "string" ? params.code.toUpperCase() : "SOLO";
    const mode = searchParams.get("mode") === "guest" || searchParams.get("modo") === "celular" ? "?modo=celular" : "";
    router.replace(`/carrete/${code}${mode}`);
  }, [params, searchParams, router]);

  return null;
}
