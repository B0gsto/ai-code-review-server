/**
 * Review endpoint handler.
 * Validates input, calls review service, returns structured response.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ReviewInputSchema } from '../schemas/index.js';
import { reviewCode } from '../services/index.js';
import { logger } from '../logger.js';
import { redactSecrets } from '../utils/index.js';

const router = Router();

/**
 * POST /review
 * Accepts code (diff, snippet, or PR) with API credentials.
 * Returns risk analysis from LLM.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate input
        const parseResult = ReviewInputSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: 'Invalid input',
                details: parseResult.error.errors,
            });
            return;
        }

        const input = parseResult.data;

        logger.info(
            {
                correlationId: req.correlationId,
                model: input.model,
                ruleset: input.ruleset,
                hasCode: !!input.code,
                hasDiff: !!input.diff,
                hasPr: !!input.pr,
            },
            'Processing review request'
        );

        // Perform review
        const result = await reviewCode(input);

        logger.info(
            {
                correlationId: req.correlationId,
                riskScore: result.risk_score,
                issueCount: result.issues.length,
                latencyMs: result.meta.latency_ms,
            },
            'Review completed'
        );

        res.json(result);
    } catch (error) {
        // Log error with redaction
        logger.error(
            {
                correlationId: req.correlationId,
                error: redactSecrets((error as Error).message),
            },
            'Review failed'
        );

        // Return appropriate error response
        const message = (error as Error).message;
        const status = message.includes('invalid JSON') ? 502 : 500;

        res.status(status).json({
            error: message.includes('API') ? 'OpenRouter API error' : message,
            correlationId: req.correlationId,
        });
    }
});

export default router;
