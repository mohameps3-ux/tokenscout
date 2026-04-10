"use client";

import { TokenCard } from "@/components/dashboard/TokenCard";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Token {
  id: string;
  address: string;
  chain: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  liquidity: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  totalScore: number;
  liquidityScore: number;
  holderScore: number;
  ageScore: number;
  volumeScore: number;
  suspicionScore: number;
  isHoneypot: boolean;
  hasBundledBuys: boolean;
  listedAt: string | null;
  pairAddress: string | null;
  dexId: string | null;
}

interface TokenGridProps {
  tokens: Token[];
  total: number;
  page: number;
  totalPages: number;
  isPro?: boolean;
}

export function TokenGrid({ tokens, total, page, totalPages, isPro = false }: TokenGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {total === 0 ? "No tokens" : `${total.toLocaleString()} token${total !== 1 ? "s" : ""}`}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </p>
      </div>

      {tokens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-600">
          No tokens scanned yet. Hit Scan Now above.
        </div>
      )}

      {/* Pagination — Pro only */}
      {isPro && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-500 px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
