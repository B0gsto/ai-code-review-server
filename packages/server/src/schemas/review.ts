/**
 * Zod schemas for code review input and output validation.
 * Supports three input types: diff, raw code, or PR.
 */

import { z } from 'zod';

const MAX_CONTENT_SIZE = 204800; // 200KB

/** Available rulesets for code review focus */
export const RulesetSchema = z.enum([
    'correctness',
    'security',
    'performance',
]);

/** Pull request input structure */
export const PRInputSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    diff: z.string().max(MAX_CONTENT_SIZE, 'PR diff exceeds 200KB'),
});

/**
 * Review request input.
 * Requires API credentials and at least one content type (diff, code, or PR).
 */
export const ReviewInputSchema = z
    .object({
        // OpenRouter credentials (required, from UI)
        apiKey: z.string().min(1, 'API key is required'),
        model: z.string().min(1, 'Model is required'),

        // Content - at least one required
        diff: z.string().max(MAX_CONTENT_SIZE, 'Diff exceeds 200KB').optional(),
        code: z.string().max(MAX_CONTENT_SIZE, 'Code exceeds 200KB').optional(),
        pr: PRInputSchema.optional(),

        // Context options
        repoName: z.string().optional(),
        languageHint: z.string().optional(),
        fileName: z.string().optional(),
        ruleset: RulesetSchema.default('correctness'),
    })
    .refine((data) => data.diff || data.code || data.pr, {
        message: 'Provide at least one of: diff, code, or pr',
    });

/** Severity levels for identified issues */
export const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/** Single issue identified in the code */
export const ReviewIssueSchema = z.object({
    type: z.string(),
    severity: SeveritySchema,
    file: z.string(),
    lines: z.array(z.number().int().nonnegative()),
    explanation: z.string(),
    suggested_fix: z.string(),
    confidence: z.number().min(0).max(1),
});

/** Missing test coverage area */
export const MissingTestSchema = z.object({
    area: z.string(),
    cases: z.array(z.string()),
});

/** Metadata about the review (model, timing, tokens) */
export const ReviewMetaSchema = z.object({
    model: z.string(),
    latency_ms: z.number().int().nonnegative(),
    prompt_tokens: z.number().int().nonnegative().optional(),
    completion_tokens: z.number().int().nonnegative().optional(),
});

/** Complete review response from the LLM */
export const ReviewOutputSchema = z.object({
    risk_score: z.number().int().min(0).max(100),
    summary: z.string(),
    issues: z.array(ReviewIssueSchema),
    missing_tests: z.array(MissingTestSchema),
    questions_for_human: z.array(z.string()),
    meta: ReviewMetaSchema,
});

// Type exports for use throughout the application
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
export type ReviewIssue = z.infer<typeof ReviewIssueSchema>;
export type Ruleset = z.infer<typeof RulesetSchema>;
