import { resolveExpiredPredictions } from "@/lib/jobs/resolver";

// POST or GET /api/predictions/resolve — resolve expired predictions
export async function POST(request: Request) {
  const authHeader = request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await resolveExpiredPredictions();

  return Response.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
