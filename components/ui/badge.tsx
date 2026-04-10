"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        {
          "bg-zinc-800 text-zinc-300 ring-zinc-700": variant === "default",
          "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30": variant === "success",
          "bg-yellow-500/10 text-yellow-400 ring-yellow-500/30": variant === "warning",
          "bg-red-500/10 text-red-400 ring-red-500/30": variant === "danger",
          "bg-transparent text-zinc-400 ring-zinc-600": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
