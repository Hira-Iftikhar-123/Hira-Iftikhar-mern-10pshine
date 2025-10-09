import pino from 'pino';
import { createWriteStream } from 'fs';
import { mkdirSync } from 'fs';

try {
    mkdirSync('./logs', { recursive: true });
} catch (error) {
    console.error('Error creating logs directory:', error);
}

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: true }
    } : undefined
}, createWriteStream('./logs/app.log'));

export default logger;


