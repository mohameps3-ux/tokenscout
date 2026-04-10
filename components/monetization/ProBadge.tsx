import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        className
      )}
    >
      <Zap className="w-2.5 h-2.5" />
      PRO
    </span>
  );
}

export function ProGate({
  children,
  fallback,
  isPro,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  isPro: boolean;
}) {
  return isPro ? <>{children}</> : <>{fallback}</>;
}
