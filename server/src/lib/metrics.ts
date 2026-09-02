/** Lightweight in-process metrics for ops dashboards / health */

const startedAt = Date.now();

let requestCount = 0;
let errorCount = 0;
let totalDurationMs = 0;
const statusCounts: Record<string, number> = {};
const pathCounts: Record<string, number> = {};

export function recordRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
) {
  requestCount += 1;
  totalDurationMs += durationMs;

  const statusKey = String(statusCode);
  statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;

  if (statusCode >= 500) {
    errorCount += 1;
  }

  // Normalize path (drop ids)
  const normalized = path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id"
    )
    .replace(/\/c[a-z0-9]{20,}/gi, "/:id")
    .split("?")[0];

  const key = `${method} ${normalized}`;
  pathCounts[key] = (pathCounts[key] ?? 0) + 1;
}

export function getMetricsSnapshot() {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  return {
    uptimeSec,
    requests: requestCount,
    errors5xx: errorCount,
    avgDurationMs:
      requestCount > 0
        ? Number((totalDurationMs / requestCount).toFixed(2))
        : 0,
    statusCounts: { ...statusCounts },
    topPaths: Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => ({ path, count })),
    memory: process.memoryUsage(),
  };
}

export function getUptimeSec() {
  return Math.floor((Date.now() - startedAt) / 1000);
}
