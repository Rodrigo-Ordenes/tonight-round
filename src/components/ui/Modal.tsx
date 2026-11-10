"use client";

import React, { useLayoutEffect, useRef } from "react";

/**
 * Modal sobre <dialog> nativo: el navegador atrapa el foco, deja inerte el fondo, cierra con Escape y devuelve
 * el foco al cerrar. `className` es la capa que centra el contenido y oscurece el fondo.
 */
export default function Modal({
  onClose,
  label,
  labelledBy,
  role,
  dismissible = true,
  className = "",
  children,
}: {
  onClose?: () => void;
  label?: string;
  labelledBy?: string;
  role?: "dialog" | "alertdialog";
  /** false: ni Escape ni el fondo lo cierran (aviso de edad). */
  dismissible?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose?.();
      }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-inherit"
    >
      <div
        className={`min-h-full ${className}`}
        onClick={(e) => {
          if (dismissible && e.target === e.currentTarget) onClose?.();
        }}
      >
        {children}
      </div>
    </dialog>
  );
}
