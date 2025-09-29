import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();

export async function createUser(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, passwordHash: hash } });
}

export async function signInUser(email: string, password: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return token;
}


