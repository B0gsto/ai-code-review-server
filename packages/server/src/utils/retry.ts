/**
 * Retry utility with exponential backoff.
 * Used for transient failures when calling external APIs.
 */

import { logger } from '../logger.js';

export interface RetryOptions {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
};

/**
 * Executes a function with exponential backoff retry.
 * Only retries on RetryableError instances.
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Only retry on retryable errors
            if (!(error instanceof RetryableError)) {
                throw error;
            }

            // Don't retry if we've exhausted attempts
            if (attempt >= opts.maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff + jitter
            const delay = Math.min(
                opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
                opts.maxDelayMs
            );

            logger.warn({ attempt: attempt + 1, delay, error: error.message }, 'Retrying after error');
            await sleep(delay);
        }
    }

    throw lastError;
}

/** Error type that signals the operation should be retried */
export class RetryableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RetryableError';
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
