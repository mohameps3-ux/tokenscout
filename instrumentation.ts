// instrumentation.ts — runs once on server startup
// Schedules token scanning (15 min) and prediction resolution (5 min)

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as Record<string, boolean>;
  if (g.__tokenscout_started__) return;
  g.__tokenscout_started__ = true;

  const SCAN_INTERVAL_MS = 15 * 60 * 1000;   // 15 minutes
  const RESOLVE_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
  const INITIAL_DELAY_MS = 10_000;            // 10s after startup

  async function runScan() {
    try {
      const { scanChain } = await import("@/lib/jobs/scanner");
      console.log("[Instrumentation] Running token scan...");
      const [base, sol] = await Promise.all([
        scanChain("BASE"),
        scanChain("SOLANA"),
      ]);
      console.log(`[Instrumentation] Scan done — BASE: +${base.added} / SOL: +${sol.added}`);
    } catch (err) {
      console.error("[Instrumentation] Scan failed:", err);
    }
  }

  async function runResolver() {
    try {
      const { resolveExpiredPredictions } = await import("@/lib/jobs/resolver");
      const result = await resolveExpiredPredictions();
      if (result.resolved > 0) {
        console.log(
          `[Instrumentation] Resolved ${result.resolved} predictions (${result.correct} correct, ${result.skipped} skipped)`
        );
      }
    } catch (err) {
      console.error("[Instrumentation] Resolver failed:", err);
    }
  }

  setTimeout(async () => {
    // Stagger: scan first, resolver 5s later
    await runScan();
    setInterval(runScan, SCAN_INTERVAL_MS);

    setTimeout(async () => {
      await runResolver();
      setInterval(runResolver, RESOLVE_INTERVAL_MS);
    }, 5_000);
  }, INITIAL_DELAY_MS);

  console.log("[Instrumentation] Scanner (15min) + Resolver (5min) scheduled");
}
