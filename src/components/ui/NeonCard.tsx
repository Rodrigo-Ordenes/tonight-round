"use client";

import React from "react";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "violet" | "fuchsia" | "emerald" | "amber" | "crimson" | "default";
  children: React.ReactNode;
  glow?: boolean;
}

export default function NeonCard({
  variant = "default",
  glow = false,
  className = "",
  children,
  ...props
}: NeonCardProps) {
  const variantStyles = {
    default: "border-white/10 bg-night-950/80 text-white",
    violet: "border-indigo-500/30 bg-indigo-950/20 text-white " + (glow ? "shadow-glow" : ""),
    fuchsia: "border-pink-500/30 bg-pink-950/20 text-white " + (glow ? "shadow-[0_0_25px_rgba(236,72,153,0.35)]" : ""),
    emerald: "border-emerald-500/30 bg-emerald-950/20 text-white " + (glow ? "shadow-glow-accent" : ""),
    amber: "border-amber-500/30 bg-amber-950/20 text-white " + (glow ? "shadow-[0_0_20px_rgba(245,158,11,0.35)]" : ""),
    crimson: "border-red-500/40 bg-red-950/30 text-white " + (glow ? "shadow-[0_0_30px_rgba(239,68,68,0.45)]" : ""),
  }[variant];

  return (
    <div
      className={`glass-panel rounded-3xl p-5 border backdrop-blur-xl transition-all ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
