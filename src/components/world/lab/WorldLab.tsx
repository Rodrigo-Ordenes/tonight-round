"use client";

import React from "react";
import dynamic from "next/dynamic";
import { WorldProvider } from "../WorldProvider";
import { LAB_ROOM } from "./labRoom";

// La escena 3D se carga aparte y solo si el nivel lo pide: el nivel 0 no baja three.js
const LabScene = dynamic(() => import("./LabScene"), { ssr: false, loading: () => null });

/** El mundo del laboratorio (vive en su layout: el lienzo sigue vivo entre /laboratorio y /laboratorio/mesa) */
export default function WorldLab({ children }: { children: React.ReactNode }) {
  return (
    <WorldProvider room={LAB_ROOM} Scene={LabScene} debug>
      {children}
    </WorldProvider>
  );
}
