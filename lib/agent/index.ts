/**
 * AI Agent - Main Entry Point
 * Exports all agent functionality
 */

export * from './tools';
export * from './queryEngine';
export * from './analytics';
export * from './recommendations';
export * from './proactive';
export * from './memory';

import { initializeTools } from './tools';
initializeTools();
