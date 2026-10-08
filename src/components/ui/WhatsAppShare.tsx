"use client";

import React, { useState } from "react";
import { MessageSquare, Check, Copy } from "lucide-react";

interface WhatsAppShareProps {
  textToShare: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

export default function WhatsAppShare({
  textToShare,
  label = "Compartir por WhatsApp",
  className = "",
  variant = "primary",
}: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(textToShare);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const baseStyle =
    "min-h-[48px] px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] select-none text-sm";

  const variantStyles = {
    primary:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-accent border border-emerald-400/30",
    secondary:
      "bg-night-800 hover:bg-night-700 text-slate-100 border border-slate-700",
    outline:
      "bg-transparent hover:bg-emerald-950/40 text-emerald-400 border border-emerald-600/40",
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full ${className}`}>
      {/* Primary: Direct WhatsApp launcher */}
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        className={`${baseStyle} ${variantStyles[variant]} flex-1`}
      >
        <MessageSquare className="w-5 h-5 fill-current" />
        <span>{label}</span>
      </button>

      {/* Secondary: Copy plain text */}
      <button
        type="button"
        onClick={handleCopy}
        className={`${baseStyle} bg-night-850 hover:bg-night-800 text-slate-200 border border-night-700 px-4`}
        title="Copiar texto al portapapeles"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span className="text-emerald-400 font-medium">¡Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300">Copiar texto</span>
          </>
        )}
      </button>
    </div>
  );
}
