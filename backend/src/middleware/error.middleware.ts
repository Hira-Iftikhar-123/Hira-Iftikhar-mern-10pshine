import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    const error = err as any;
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    
    logger.error({
        err: error,
        path: req.path,
        method: req.method,
        status,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    }, `Error ${status}: ${message}`);
    
    res.status(status).json({ error: message });
}
