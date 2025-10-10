import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) 
{
    const start = Date.now();
    const { method, path, query, body } = req;
    
    const sanitizedBody = sanitizeRequestBody(body);
    
    logger.info({
        type: 'http_request',
        method,
        path,
        query,
        body: sanitizedBody,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    }, `Incoming ${method} ${path}`);

    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) 
    {
        const duration = Date.now() - start;
        
        logger.info({
            type: 'http_response',
            method,
            path,
            status: res.statusCode,
            duration,
            contentLength: res.get('Content-Length'),
            timestamp: new Date().toISOString()
        }, `Outgoing ${method} ${path} - ${res.statusCode} (${duration}ms)`);
        
        originalEnd.call(this, chunk, encoding);
    };

    next();
}

function sanitizeRequestBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    if (sanitized.password) {
        sanitized.password = '[REDACTED]';
    }
    if (sanitized.token) {
        sanitized.token = '[REDACTED]';
    }
    
    return sanitized;
}
