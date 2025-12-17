/**
 * Prometheus metrics for observability.
 * Tracks request counts, durations, and OpenRouter API calls.
 */

import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

// Collect Node.js default metrics (memory, CPU, etc.)
collectDefaultMetrics({ register });

/** Total HTTP requests by route and status */
export const requestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['route', 'status'] as const,
    registers: [register],
});

/** Request duration histogram */
export const requestDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'Request duration in milliseconds',
    labelNames: ['route'] as const,
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register],
});

/** OpenRouter API calls by status */
export const openrouterCalls = new Counter({
    name: 'openrouter_calls_total',
    help: 'Total OpenRouter API calls',
    labelNames: ['status'] as const,
    registers: [register],
});

/** OpenRouter latency histogram */
export const openrouterLatency = new Histogram({
    name: 'openrouter_latency_ms',
    help: 'OpenRouter API call latency in milliseconds',
    buckets: [100, 250, 500, 1000, 2500, 5000, 10000, 30000],
    registers: [register],
});
