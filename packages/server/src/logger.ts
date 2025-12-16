/**
 * Application logger using Pino.
 * Configured to redact sensitive fields automatically.
 */

import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
    level: config.LOG_LEVEL,
    redact: {
        paths: ['*.apiKey', '*.api_key', 'apiKey'],
        censor: '[REDACTED]',
    },
});
