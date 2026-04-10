import { scanChain } from "@/lib/jobs/scanner";

// Called by Railway cron / external cron service every 15min
export async function GET(request: Request) {
  // Simple auth check via header
  const authHeader = request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [baseResult, solanaResult] = await Promise.all([
    scanChain("BASE"),
    scanChain("SOLANA"),
  ]);

  return Response.json({
    success: true,
    base: baseResult,
    solana: solanaResult,
    timestamp: new Date().toISOString(),
  });
}
