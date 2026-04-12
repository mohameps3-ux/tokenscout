import { scanChain } from "@/lib/jobs/scanner";
import { CHAINS, type Chain, normalizeChain } from "@/lib/chains";
import { NextRequest } from "next/server";

// Manual trigger endpoint (also called by cron)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawChain = body.chain as string | undefined;

    let chains: Chain[];
    if (rawChain) {
      const c = normalizeChain(rawChain);
      if (!c) {
        return Response.json(
          { error: `Invalid chain. Use one of: ${CHAINS.join(", ")}` },
          { status: 400 }
        );
      }
      chains = [c];
    } else {
      chains = [...CHAINS];
    }

    const results = await Promise.all(chains.map((c) => scanChain(c)));

    return Response.json({
      success: true,
      results: chains.map((c, i) => ({ chain: c, ...results[i] })),
    });
  } catch (error) {
    console.error("[API /tokens/scan] Error:", error);
    return Response.json(
      { error: "Scan failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new Request("http://localhost/api/tokens/scan", {
    method: "POST",
    body: JSON.stringify({}),
  }) as NextRequest);
}
