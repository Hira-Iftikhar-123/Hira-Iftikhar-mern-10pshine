import { Request, Response } from 'express';
import { z } from 'zod';
import { signInUser, createUser, findUserById } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export async function signup(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) {
        logger.warn({
            type: 'auth_controller',
            action: 'signup_validation_failed',
            email: req.body.email,
            errors: parse.error.issues,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Signup validation failed for email: ${req.body.email}`);
        return res.status(400).json({ error: 'Invalid input' });
    }
    
    const { email, password } = parse.data;
    try {
        const user = await createUser(email, password);
        logger.info({
            type: 'auth_controller',
            action: 'signup_success',
            userId: user.id,
            email: user.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Signup successful for email: ${email}`);
        return res.status(201).json({ id: user.id, email: user.email });
    } catch (error: any) {
        logger.error({
            type: 'auth_controller',
            action: 'signup_error',
            email,
            error: error.message,
            status: error.status,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Signup error for email: ${email}`);
        throw error;
    }
}

export async function login(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) {
        logger.warn({
            type: 'auth_controller',
            action: 'login_validation_failed',
            email: req.body.email,
            errors: parse.error.issues,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Login validation failed for email: ${req.body.email}`);
        return res.status(400).json({ error: 'Invalid input' });
    }
    
    const { email, password } = parse.data;
    try {
        const token = await signInUser(email, password);
        if (!token) {
            logger.warn({
                type: 'auth_controller',
                action: 'login_failed',
                email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            }, `Login failed - invalid credentials for email: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        logger.info({
            type: 'auth_controller',
            action: 'login_success',
            email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Login successful for email: ${email}`);
        
        return res.json({ token });
    } catch (error: any) {
        logger.error({
            type: 'auth_controller',
            action: 'login_error',
            email,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Login error for email: ${email}`);
        throw error;
    }
}

export async function me(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    try {
        const user = await findUserById(userId);
        if (!user) {
            logger.warn({
                type: 'auth_controller',
                action: 'me_user_not_found',
                userId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            }, `User lookup failed for userId: ${userId}`);
            return res.status(404).json({ error: 'Not found' });
        }
        
        logger.debug({
            type: 'auth_controller',
            action: 'me_success',
            userId: user.id,
            email: user.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User profile retrieved for: ${user.email}`);
        
        res.json({ id: user.id, email: user.email });
    } catch (error: any) {
        logger.error({
            type: 'auth_controller',
            action: 'me_error',
            userId,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Error retrieving user profile for userId: ${userId}`);
        throw error;
    }
}