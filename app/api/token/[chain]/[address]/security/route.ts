import { NextRequest } from "next/server";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";
import type { Chain } from "@/lib/chains";

export const dynamic = "force-dynamic";

// GoPlus chain ID mapping for EVM chains
const GOPLUS_CHAIN_IDS: Partial<Record<Chain, string>> = {
  ETHEREUM: "1",
  BSC: "56",
  POLYGON: "137",
  ARBITRUM: "42161",
  BASE: "8453",
  OPTIMISM: "10",
  AVALANCHE: "43114",
  FANTOM: "250",
  ZKSYNC: "324",
};

interface GoPlusHolder {
  address: string;
  tag?: string;
  is_locked?: number;
  locked_detail?: { end_time?: string; opt_time?: string; amount?: string }[];
  percent?: string;
  is_contract?: number;
}

interface GoPlusResult {
  creator_address?: string;
  owner_address?: string;
  is_open_source?: string;
  is_proxy?: string;
  is_mintable?: string;
  can_take_back_ownership?: string;
  owner_change_balance?: string;
  is_honeypot?: string;
  buy_tax?: string;
  sell_tax?: string;
  is_blacklisted?: string;
  is_anti_whale?: string;
  trading_cooldown?: string;
  cannot_sell_all?: string;
  lp_holders?: GoPlusHolder[];
  holders?: GoPlusHolder[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chain: string; address: string }> }
) {
  const { chain, address } = await params;
  const normalized = normalizeChain(chain.toUpperCase());

  let url: string;
  if (normalized === "SOLANA") {
    url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`;
  } else {
    const chainId = normalized ? GOPLUS_CHAIN_IDS[normalized] : null;
    if (!chainId) return Response.json({ result: null });
    url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) return Response.json({ result: null });
    const json = await res.json();

    // GoPlus returns { result: { [address_lower]: { ... } } }
    const raw: GoPlusResult =
      json.result?.[address.toLowerCase()] ??
      json.result?.[address] ??
      null;

    if (!raw) return Response.json({ result: null });

    // Compute LP locked percentage
    const lpHolders = raw.lp_holders ?? [];
    const liquidityLockedPct =
      lpHolders
        .filter((h) => h.is_locked === 1)
        .reduce((sum, h) => sum + parseFloat(h.percent ?? "0"), 0) * 100;

    // Ownership renounced: owner is null, zero address, or empty
    const ownerAddr = raw.owner_address ?? "";
    const ownershipRenounced =
      !ownerAddr ||
      ownerAddr === "0x0000000000000000000000000000000000000000" ||
      ownerAddr === "0x000000000000000000000000000000000000dead";

    const cfg = normalized ? CHAIN_CONFIG[normalized] : null;

    return Response.json({
      result: {
        creatorAddress: raw.creator_address ?? null,
        ownerAddress: ownershipRenounced ? null : ownerAddr || null,
        isOpenSource: raw.is_open_source === "1",
        isProxy: raw.is_proxy === "1",
        isMintable: raw.is_mintable === "1",
        canTakeBackOwnership: raw.can_take_back_ownership === "1",
        ownerChangeBalance: raw.owner_change_balance === "1",
        isHoneypot: raw.is_honeypot === "1",
        buyTax: raw.buy_tax != null ? parseFloat(raw.buy_tax) : null,
        sellTax: raw.sell_tax != null ? parseFloat(raw.sell_tax) : null,
        isBlacklisted: raw.is_blacklisted === "1",
        isAntiWhale: raw.is_anti_whale === "1",
        tradingCooldown: raw.trading_cooldown === "1",
        ownershipRenounced,
        liquidityLockedPct: Math.min(100, liquidityLockedPct),
        lpHolders: lpHolders.slice(0, 5).map((h) => ({
          address: h.address,
          tag: h.tag ?? null,
          isLocked: h.is_locked === 1,
          percent: parseFloat(h.percent ?? "0") * 100,
          lockUntil: h.locked_detail?.[0]?.end_time ?? null,
        })),
        holders: (raw.holders ?? []).slice(0, 10).map((h) => ({
          address: h.address,
          tag: h.tag ?? null,
          isContract: h.is_contract === 1,
          percent: parseFloat(h.percent ?? "0") * 100,
        })),
        explorerUrl: cfg ? cfg.explorerUrl(raw.creator_address ?? "") : null,
      },
    });
  } catch {
    return Response.json({ result: null });
  }
}
