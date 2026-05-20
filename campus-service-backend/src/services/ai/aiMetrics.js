const metrics = {
  total: 0,
  success: 0,
  failure: 0,
  fallback: 0,
  totalLatencyMs: 0,
  lastFailureAt: null,
  lastSuccessAt: null,
};

const recordAiProcessing = ({ status, latencyMs = 0 }) => {
  metrics.total += 1;
  metrics.totalLatencyMs += Math.max(0, Number(latencyMs) || 0);

  if (status === "success") {
    metrics.success += 1;
    metrics.lastSuccessAt = new Date();
  } else if (status === "fallback") {
    metrics.fallback += 1;
    metrics.lastFailureAt = new Date();
  } else {
    metrics.failure += 1;
    metrics.lastFailureAt = new Date();
  }
};

const getAiRuntimeMetrics = () => {
  const attempts = metrics.total || 0;
  const failures = metrics.failure + metrics.fallback;

  return {
    totalAttempts: attempts,
    successCount: metrics.success,
    failureCount: metrics.failure,
    fallbackCount: metrics.fallback,
    failureRate: attempts ? Number((failures / attempts).toFixed(4)) : 0,
    averageLatencyMs: attempts ? Math.round(metrics.totalLatencyMs / attempts) : 0,
    lastFailureAt: metrics.lastFailureAt,
    lastSuccessAt: metrics.lastSuccessAt,
  };
};

module.exports = {
  recordAiProcessing,
  getAiRuntimeMetrics,
};
