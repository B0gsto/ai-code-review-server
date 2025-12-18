/**
 * OpenRouter API client.
 * Handles LLM calls with retry, timeout, and response validation.
 */

import { request } from 'undici';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { retryWithBackoff, RetryableError } from '../utils/index.js';
import { openrouterCalls, openrouterLatency } from '../metrics.js';
import { ReviewOutputSchema, type ReviewOutput } from '../schemas/index.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface CallOptions {
    apiKey: string;
    model: string;
}

interface OpenRouterResponse {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
}

/**
 * Calls OpenRouter with the given messages and validates the response.
 * Includes retry logic for transient failures (429, 5xx).
 */
export async function callOpenRouter(
    messages: ChatMessage[],
    options: CallOptions
): Promise<ReviewOutput> {
    const startTime = Date.now();

    const makeRequest = async (): Promise<OpenRouterResponse> => {
        const response = await request(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${options.apiKey}`,
                'Content-Type': 'application/json',
                'X-Title': 'MCP Code Review',
                'HTTP-Referer': 'http://localhost',
            },
            body: JSON.stringify({
                model: options.model,
                messages,
                response_format: { type: 'json_object' },
                max_tokens: 4096,
                temperature: 0.1, // Low temp for consistent structured output
            }),
            bodyTimeout: config.OPENROUTER_TIMEOUT_MS,
            headersTimeout: config.OPENROUTER_TIMEOUT_MS,
        });

        // Retry on rate limit or server errors
        if (response.statusCode === 429 || response.statusCode >= 500) {
            throw new RetryableError(`OpenRouter ${response.statusCode}`);
        }

        if (response.statusCode !== 200) {
            const body = await response.body.text();
            throw new Error(`OpenRouter error ${response.statusCode}: ${body}`);
        }

        return (await response.body.json()) as OpenRouterResponse;
    };

    try {
        const response = await retryWithBackoff(makeRequest, {
            maxRetries: config.OPENROUTER_MAX_RETRIES,
        });

        const latencyMs = Date.now() - startTime;
        openrouterLatency.observe(latencyMs);
        openrouterCalls.inc({ status: 'success' });

        // Extract and parse LLM response
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from OpenRouter');
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch {
            logger.error({ content: content.slice(0, 200) }, 'LLM returned invalid JSON');
            throw new Error('LLM returned invalid JSON');
        }

        // Validate against schema, adding meta info
        const parsedObj = parsed as Record<string, unknown>;
        const validated = ReviewOutputSchema.safeParse({
            ...parsedObj,
            meta: {
                model: options.model,
                latency_ms: latencyMs,
                prompt_tokens: response.usage?.prompt_tokens,
                completion_tokens: response.usage?.completion_tokens,
            },
        });

        if (!validated.success) {
            logger.warn({ errors: validated.error.errors }, 'LLM response validation failed');
            throw new Error('LLM response does not match expected schema');
        }

        return validated.data;
    } catch (error) {
        openrouterCalls.inc({ status: 'error' });
        throw error;
    }
}
