/**
 * Server configuration loaded from environment variables.
 * All settings have sensible defaults for local development.
 */

export const config = {
    /** Server port */
    PORT: parseInt(process.env.PORT || '3000', 10),

    /** Node environment */
    NODE_ENV: process.env.NODE_ENV || 'development',

    /** Log level for Pino */
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    /** Rate limit: max requests per window */
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

    /** Rate limit: window duration in milliseconds */
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

    /** Maximum content size in bytes (200KB) */
    MAX_CONTENT_SIZE: parseInt(process.env.MAX_CONTENT_SIZE || '204800', 10),

    /** OpenRouter request timeout in milliseconds */
    OPENROUTER_TIMEOUT_MS: parseInt(process.env.OPENROUTER_TIMEOUT_MS || '30000', 10),

    /** Maximum retries for OpenRouter calls */
    OPENROUTER_MAX_RETRIES: parseInt(process.env.OPENROUTER_MAX_RETRIES || '3', 10),
} as const;
