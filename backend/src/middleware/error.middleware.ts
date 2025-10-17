import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import { ZodError } from 'zod';

function formatZodErrors(error: ZodError) {
    return error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    const error = err as any;

    let status = error.status || 500;
    let message = error.message || 'Internal Server Error';
    let details: unknown = undefined;

    // Zod validation errors
    if (error instanceof ZodError) {
        status = 400;
        message = 'Validation failed';
        details = formatZodErrors(error);
    }

    // Postgres unique violation
    if (error?.code === '23505') {
        status = 409;
        message = 'A record with the same unique value already exists';
    }

    // Auth / forbidden
    if (message === 'Invalid token') status = 401;
    if (message === 'Unauthorized') status = 401;

    // Enhanced logging
    logger.error({
        err: error,
        path: req.path,
        method: req.method,
        status,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    }, `Error ${status}: ${message}`);

    const payload: any = { error: message };
    if (details) payload.details = details;

    res.status(status).json(payload);
}