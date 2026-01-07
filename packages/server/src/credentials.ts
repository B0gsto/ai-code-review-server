/**
 * Credential storage for API key and model.
 * Stores in-memory with optional file persistence.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'ai-code-review');
const CONFIG_FILE = join(CONFIG_DIR, 'credentials.json');

interface Credentials {
    apiKey: string;
    model: string;
}

// In-memory cache
let cachedCredentials: Credentials | null = null;

/**
 * Loads credentials from file if exists.
 */
function loadFromFile(): Credentials | null {
    try {
        if (existsSync(CONFIG_FILE)) {
            const data = readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch {
        // Ignore errors
    }
    return null;
}

/**
 * Saves credentials to file.
 */
function saveToFile(creds: Credentials): void {
    try {
        mkdirSync(CONFIG_DIR, { recursive: true });
        writeFileSync(CONFIG_FILE, JSON.stringify(creds, null, 2));
    } catch {
        // Ignore errors - will work in-memory only
    }
}

/**
 * Gets stored credentials.
 */
export function getCredentials(): Credentials | null {
    if (cachedCredentials) {
        return cachedCredentials;
    }
    cachedCredentials = loadFromFile();
    return cachedCredentials;
}

/**
 * Sets credentials (saves to memory and file).
 */
export function setCredentials(creds: Credentials): void {
    cachedCredentials = creds;
    saveToFile(creds);
}

/**
 * Checks if credentials are configured.
 */
export function hasCredentials(): boolean {
    return getCredentials() !== null;
}

/**
 * Clears stored credentials.
 */
export function clearCredentials(): void {
    cachedCredentials = null;
    try {
        if (existsSync(CONFIG_FILE)) {
            writeFileSync(CONFIG_FILE, '{}');
        }
    } catch {
        // Ignore
    }
}
