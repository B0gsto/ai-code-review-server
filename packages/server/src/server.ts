/**
 * Express server factory.
 * Creates configured Express app with middleware and routes.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import { logger } from './logger.js';
import { register, requestsTotal, requestDuration } from './metrics.js';
import { reviewRouter } from './routes/index.js';
import { redactSecrets } from './utils/index.js';

// Extend Express Request type for correlation ID
declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}

/**
 * Creates and configures the Express application.
 */
export function createServer() {
    const app = express();

    // --- Middleware ---

    app.use(cors());
    app.use(express.json({ limit: '250kb' }));

    // Rate limiting
    app.use(
        rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW_MS,
            max: config.RATE_LIMIT_MAX,
            message: { error: 'Too many requests' },
        })
    );

    // Correlation ID
    app.use((req: Request, res: Response, next: NextFunction) => {
        req.correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
        res.setHeader('x-correlation-id', req.correlationId);
        next();
    });

    // Request metrics
    app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const route = req.route?.path || req.path;
            requestsTotal.inc({ route, status: res.statusCode.toString() });
            requestDuration.observe({ route }, Date.now() - start);
        });
        next();
    });

    // --- Routes ---

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/config', (_req, res) => {
        res.json({
            rateLimit: { max: config.RATE_LIMIT_MAX, windowMs: config.RATE_LIMIT_WINDOW_MS },
            maxContentSize: config.MAX_CONTENT_SIZE,
            openrouterTimeout: config.OPENROUTER_TIMEOUT_MS,
        });
    });

    app.get('/metrics', async (_req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });

    app.use('/review', reviewRouter);

    // --- Error Handler ---

    app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
        logger.error(
            {
                correlationId: req.correlationId,
                error: redactSecrets(error.message),
                stack: config.NODE_ENV === 'development' ? error.stack : undefined,
            },
            'Unhandled error'
        );

        res.status(500).json({
            error: 'Internal Server Error',
            correlationId: req.correlationId,
        });
    });

    return app;
}
