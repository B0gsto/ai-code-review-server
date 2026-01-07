/**
 * MCP Server for code review.
 * Exposes the review_code tool via stdio transport.
 * Uses stored credentials from setup page or prompts user to configure.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { reviewCode } from './services/index.js';
import { ReviewInputSchema } from './schemas/index.js';
import { getCredentials, hasCredentials } from './credentials.js';
import { logger } from './logger.js';

const SETUP_URL = 'http://localhost:3000/setup';

// Tool definition - no longer requires apiKey/model from user
const REVIEW_TOOL = {
    name: 'review_code',
    description:
        'Analyze code for correctness, security, or performance issues. ' +
        'Accepts diff or raw code. Returns risk score and identified issues.',
    inputSchema: {
        type: 'object' as const,
        properties: {
            code: {
                type: 'string',
                description: 'Code snippet to review',
            },
            diff: {
                type: 'string',
                description: 'Unified diff content',
            },
            languageHint: {
                type: 'string',
                description: 'Programming language (e.g., typescript, python)',
            },
            fileName: {
                type: 'string',
                description: 'File name for context',
            },
            ruleset: {
                type: 'string',
                enum: ['correctness', 'security', 'performance'],
                description: 'Review focus (default: correctness)',
            },
        },
        required: [],
    },
};

async function main() {
    const server = new Server(
        { name: 'ai-code-review', version: '1.0.0' },
        { capabilities: { tools: {} } }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [REVIEW_TOOL],
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name !== 'review_code') {
            throw new Error(`Unknown tool: ${request.params.name}`);
        }

        // Check for stored credentials
        if (!hasCredentials()) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `⚠️ API credentials not configured.\n\n` +
                            `Please run the REST server and open: ${SETUP_URL}\n\n` +
                            `1. Start server: npm run dev --workspace=packages/server\n` +
                            `2. Open ${SETUP_URL} in browser\n` +
                            `3. Enter your OpenRouter API key and select model\n` +
                            `4. Try this tool again`,
                    },
                ],
                isError: true,
            };
        }

        const creds = getCredentials()!;
        const args = request.params.arguments || {};

        // Validate input
        const parseResult = ReviewInputSchema.safeParse({
            apiKey: creds.apiKey,
            model: creds.model,
            code: args.code,
            diff: args.diff,
            languageHint: args.languageHint,
            fileName: args.fileName,
            ruleset: args.ruleset || 'correctness',
        });

        if (!parseResult.success) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Invalid input',
                            details: parseResult.error.errors,
                        }),
                    },
                ],
                isError: true,
            };
        }

        try {
            logger.info({ model: creds.model }, 'MCP: Processing review');
            const result = await reviewCode(parseResult.data);

            // Format output nicely
            const output = [
                `## Risk Score: ${result.risk_score}/100`,
                '',
                `**Summary:** ${result.summary}`,
                '',
            ];

            if (result.issues.length > 0) {
                output.push('### Issues Found:');
                result.issues.forEach((issue, i) => {
                    output.push(`${i + 1}. **[${issue.severity.toUpperCase()}]** ${issue.type}`);
                    output.push(`   - ${issue.explanation}`);
                    output.push(`   - Fix: ${issue.suggested_fix}`);
                });
            }

            if (result.questions_for_human.length > 0) {
                output.push('', '### Questions:');
                result.questions_for_human.forEach((q) => output.push(`- ${q}`));
            }

            return {
                content: [{ type: 'text', text: output.join('\n') }],
            };
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'MCP: Review failed');
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${(error as Error).message}`,
                    },
                ],
                isError: true,
            };
        }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server started on stdio');
}

main().catch((error) => {
    logger.error({ error }, 'MCP server failed to start');
    process.exit(1);
});
