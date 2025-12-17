/**
 * User prompt builder for code review requests.
 * Constructs the prompt based on input type (diff, code, or PR).
 */

import type { ReviewInput } from '../schemas/index.js';

/**
 * Builds the user prompt from review input.
 * Adapts format based on whether input is diff, code, or PR.
 */
export function buildUserPrompt(input: ReviewInput): string {
    const parts: string[] = [];

    // Add ruleset context
    parts.push(`Analyze this code for ${input.ruleset} concerns.`);

    // Add optional context
    if (input.repoName) {
        parts.push(`Repository: ${input.repoName}`);
    }
    if (input.languageHint) {
        parts.push(`Language: ${input.languageHint}`);
    }
    if (input.fileName) {
        parts.push(`File: ${input.fileName}`);
    }

    parts.push('');

    // Add content based on input type
    if (input.pr) {
        parts.push(`PR Title: ${input.pr.title}`);
        if (input.pr.description) {
            parts.push(`PR Description: ${input.pr.description}`);
        }
        parts.push('');
        parts.push('```diff');
        parts.push(input.pr.diff);
        parts.push('```');
    } else if (input.diff) {
        parts.push('```diff');
        parts.push(input.diff);
        parts.push('```');
    } else if (input.code) {
        const lang = input.languageHint || '';
        parts.push(`\`\`\`${lang}`);
        parts.push(input.code);
        parts.push('```');
    }

    parts.push('');
    parts.push('Respond with JSON only.');

    return parts.join('\n');
}
