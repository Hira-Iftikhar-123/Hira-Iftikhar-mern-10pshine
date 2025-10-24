import { Request, Response } from 'express';
import { z } from 'zod';
import { signInUser, createUser, findUserById, updateUser, deleteUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

function formatZodErrors(error: z.ZodError<unknown>): { field: string; message: string }[] {
    return error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}

const credentialsSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    profilePicture: z.string().optional()
});

export async function signup(req: Request, res: Response) {
    const parse = signupSchema.safeParse(req.body);

    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }

    const { email, password, name, profilePicture } = parse.data;
    const user = await createUser(email, password, name, profilePicture);

    return res.status(201).json({ id: user.id, email: user.email, name: user.name, profilePicture: user.profilePicture });
}


export async function login(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }
    const { email, password } = parse.data;
    const token = await signInUser(email, password);
    if (!token) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.json({ token });
}

export async function me(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json({ id: user.id, email: user.email, name: user.name, profilePicture: user.profilePicture });
}

const profileUpdateSchema = z.object({
    name: z.string().optional(),
    profilePicture: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional()
});

export async function updateProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const parse = profileUpdateSchema.safeParse(req.body);

    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }

    const { name, profilePicture, currentPassword, newPassword } = parse.data;
    
    try {
        logger.info({
            type: 'user_activity',
            action: 'profile_update',
            userId,
            fieldsToUpdate: Object.keys(parse.data).filter(key => parse.data[key as keyof typeof parse.data] !== undefined),
            timestamp: new Date().toISOString()
        }, `User ${userId} updating profile`);

        const updatedUser = await updateUser(userId, { name, profilePicture, currentPassword, newPassword });
        
        logger.info({
            type: 'user_activity',
            action: 'profile_update_success',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} profile updated successfully`);
        
        res.json({ id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, profilePicture: updatedUser.profilePicture });
    } catch (error: any) {
        logger.error({
            type: 'user_activity',
            action: 'profile_update_error',
            userId,
            error: error.message,
            timestamp: new Date().toISOString()
        }, `Error updating profile for user ${userId}`);
        throw error;
    }
}

export async function deleteProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    
    try {
        logger.info({
            type: 'user_activity',
            action: 'account_deletion',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} deleting account`);

        await deleteUser(userId);
        
        logger.info({
            type: 'user_activity',
            action: 'account_deletion_success',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} account deleted successfully`);
        
        res.status(204).send();
    } catch (error: any) {
        logger.error({
            type: 'user_activity',
            action: 'account_deletion_error',
            userId,
            error: error.message,
            timestamp: new Date().toISOString()
        }, `Error deleting account for user ${userId}`);
        throw error;
    }
}


