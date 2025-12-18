/**
 * Code review service.
 * Orchestrates prompt building and OpenRouter calls.
 */

import { callOpenRouter } from './openrouter.js';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/index.js';
import type { ReviewInput, ReviewOutput } from '../schemas/index.js';

/**
 * Performs a code review using the configured LLM.
 * Builds prompts from input and returns validated output.
 */
export async function reviewCode(input: ReviewInput): Promise<ReviewOutput> {
    const userPrompt = buildUserPrompt(input);

    const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: userPrompt },
    ];

    return callOpenRouter(messages, {
        apiKey: input.apiKey,
        model: input.model,
    });
}
