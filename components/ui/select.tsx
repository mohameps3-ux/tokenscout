"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
