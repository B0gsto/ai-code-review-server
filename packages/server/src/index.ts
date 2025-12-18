/**
 * Application entry point.
 * Starts the Express server.
 */

import { createServer } from './server.js';
import { config } from './config.js';
import { logger } from './logger.js';

const server = createServer();

server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
});
