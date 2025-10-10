import { Request, Response } from 'express';
import { z } from 'zod';
import { signInUser, createUser, findUserById } from '../services/auth.service';
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

export async function signup(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);

    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }

    const { email, password } = parse.data;
    const user = await createUser(email, password);

    return res.status(201).json({ id: user.id, email: user.email });
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
    res.json({ id: user.id, email: user.email });
}


