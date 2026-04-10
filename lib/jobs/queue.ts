import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | null = null;
let scanQueue: Queue | null = null;

function getConnection(): IORedis {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    connection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return connection;
}

export function getScanQueue(): Queue {
  if (!scanQueue) {
    scanQueue = new Queue("token-scan", {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return scanQueue;
}

export async function scheduleScanJobs(): Promise<void> {
  const queue = getScanQueue();

  // Remove existing repeatable jobs to avoid duplicates
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Schedule token scans every 15 minutes
  await queue.add(
    "scan-base",
    { chain: "BASE" },
    { repeat: { every: 15 * 60 * 1000 }, jobId: "scan-base-repeat" }
  );

  await queue.add(
    "scan-solana",
    { chain: "SOLANA" },
    { repeat: { every: 15 * 60 * 1000 }, jobId: "scan-solana-repeat" }
  );

  console.log("[Queue] Scheduled token scan jobs (every 15 min)");
}

export { getConnection };
