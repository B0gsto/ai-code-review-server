/**
 * Secret redaction utility.
 * Prevents sensitive data from appearing in logs or error messages.
 */

/** Patterns that indicate sensitive content */
const SECRET_PATTERNS = [
    /sk-or-[a-zA-Z0-9-]+/g,    // OpenRouter API keys
    /sk-[a-zA-Z0-9-]+/g,       // OpenAI-style keys
    /Bearer\s+[a-zA-Z0-9-_.]+/gi,
];

/**
 * Replaces sensitive patterns in a string with [REDACTED].
 */
export function redactSecrets(input: string): string {
    let result = input;
    for (const pattern of SECRET_PATTERNS) {
        result = result.replace(pattern, '[REDACTED]');
    }
    return result;
}
