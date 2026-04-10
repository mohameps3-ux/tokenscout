import { scanChain } from "@/lib/jobs/scanner";
import { NextRequest } from "next/server";

// Manual trigger endpoint (also called by cron)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const chain = (body.chain as "BASE" | "SOLANA") ?? null;

    if (chain && chain !== "BASE" && chain !== "SOLANA") {
      return Response.json({ error: "Invalid chain. Use BASE or SOLANA" }, { status: 400 });
    }

    const chains: Array<"BASE" | "SOLANA"> = chain ? [chain] : ["BASE", "SOLANA"];

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

// Allow GET for easy browser testing
export async function GET() {
  return POST(new Request("http://localhost/api/tokens/scan", {
    method: "POST",
    body: JSON.stringify({}),
  }) as NextRequest);
}
