"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, Target, Gift } from "lucide-react";

const TABS = [
  { id: "scanner",     label: "Scanner",     icon: BarChart3 },
  { id: "predictions", label: "Predictions", icon: Target    },
  { id: "referral",    label: "Referral",    icon: Gift      },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardTabs({
  activeTab,
  children,
}: {
  activeTab: TabId;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "scanner") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {isPending && activeTab !== id && (
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}
