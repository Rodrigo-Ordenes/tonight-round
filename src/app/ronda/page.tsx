"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveCode } from "@/lib/useActiveCode";

export default function RondaRedirect() {
  const router = useRouter();
  const { code } = useActiveCode();

  useEffect(() => {
    router.replace(`/carrete/${code}`);
  }, [code, router]);

  return null;
}
