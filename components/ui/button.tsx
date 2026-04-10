"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700": variant === "default",
            "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white": variant === "outline",
            "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-500": variant === "danger",
            "bg-emerald-600 text-white hover:bg-emerald-500": variant === "success",
          },
          {
            "h-7 px-3 text-xs": size === "sm",
            "h-9 px-4 text-sm": size === "md",
            "h-11 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
