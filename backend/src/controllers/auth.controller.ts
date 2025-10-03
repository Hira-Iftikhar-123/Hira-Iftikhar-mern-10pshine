import { Request, Response } from 'express';
import { z } from 'zod';
import { signInUser, createUser } from '../services/auth.service';
import mysql from 'mysql2/promise';
import { AuthRequest } from '../middleware/auth.middleware';

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export async function signup(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
    const { email, password } = parse.data;
    const user = await createUser(email, password);
    return res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
    const { email, password } = parse.data;
    const token = await signInUser(email, password);
    if (!token) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token });
}

export async function me(req: AuthRequest, res: Response) {
    const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });
    const userId = req.userId!;
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.execute('SELECT id, email FROM users WHERE id = ?', [userId]);
        const user = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;
        if (!user) return res.status(404).json({ error: 'Not found' });
        res.json({ id: user.id, email: user.email });
    } finally {
        conn.release();
    }
}


