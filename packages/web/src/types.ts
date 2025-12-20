/**
 * TypeScript types for review API.
 * Mirrors the backend Zod schemas.
 */

export type Ruleset = 'correctness' | 'security' | 'performance';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/** Input for a code review request */
export interface ReviewInput {
    apiKey: string;
    model: string;
    diff?: string;
    code?: string;
    pr?: {
        title: string;
        description?: string;
        diff: string;
    };
    repoName?: string;
    languageHint?: string;
    fileName?: string;
    ruleset: Ruleset;
}

/** Individual issue identified in the code */
export interface ReviewIssue {
    type: string;
    severity: Severity;
    file: string;
    lines: number[];
    explanation: string;
    suggested_fix: string;
    confidence: number;
}

/** Missing test coverage area */
export interface MissingTest {
    area: string;
    cases: string[];
}

/** Review response from the API */
export interface ReviewOutput {
    risk_score: number;
    summary: string;
    issues: ReviewIssue[];
    missing_tests: MissingTest[];
    questions_for_human: string[];
    meta: {
        model: string;
        latency_ms: number;
        prompt_tokens?: number;
        completion_tokens?: number;
    };
}
