/**
 * MCP Server for code review.
 * Exposes the review_code tool via stdio transport.
 * Can be used with Claude Desktop and other MCP clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { reviewCode } from './services/index.js';
import { ReviewInputSchema } from './schemas/index.js';
import { logger } from './logger.js';

// Tool definition for review_code
const REVIEW_TOOL = {
    name: 'review_code',
    description:
        'Analyze code for correctness, security, or performance issues. ' +
        'Accepts diff, raw code, or PR content. Returns risk score and issues.',
    inputSchema: {
        type: 'object' as const,
        properties: {
            apiKey: {
                type: 'string',
                description: 'OpenRouter API key',
            },
            model: {
                type: 'string',
                description: 'Model to use (e.g., anthropic/claude-3.5-sonnet)',
            },
            diff: {
                type: 'string',
                description: 'Unified diff content',
            },
            code: {
                type: 'string',
                description: 'Raw code snippet to review',
            },
            languageHint: {
                type: 'string',
                description: 'Programming language (e.g., typescript)',
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
        required: ['apiKey', 'model'],
    },
};

/**
 * Creates and starts the MCP server.
 */
async function main() {
    const server = new Server(
        {
            name: 'ai-code-review',
            version: '1.0.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
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

        const args = request.params.arguments;

        // Validate input
        const parseResult = ReviewInputSchema.safeParse({
            ...args,
            ruleset: args?.ruleset || 'correctness',
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
            logger.info({ model: parseResult.data.model }, 'MCP: Processing review');
            const result = await reviewCode(parseResult.data);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'MCP: Review failed');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: (error as Error).message,
                        }),
                    },
                ],
                isError: true,
            };
        }
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('MCP server started on stdio');
}

main().catch((error) => {
    logger.error({ error }, 'MCP server failed to start');
    process.exit(1);
});
