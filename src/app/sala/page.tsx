"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveCode } from "@/lib/useActiveCode";

export default function SalaRedirect() {
  const router = useRouter();
  const { code } = useActiveCode();

  useEffect(() => {
    if (code && code !== "SOLO") {
      router.replace(`/carrete/${code}`);
    } else {
      router.replace("/");
    }
  }, [code, router]);

  return null;
}
