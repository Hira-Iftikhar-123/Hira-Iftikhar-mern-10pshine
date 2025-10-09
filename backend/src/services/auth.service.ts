import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'Notes_App',
    max: 10
});

async function ensureTables() {
    const client = await pool.connect();
    try {
        const sqlUser = `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        const sqlNote = `CREATE TABLE IF NOT EXISTS notes (
            id UUID PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            user_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`;
        
        await client.query(sqlUser);
        await client.query(sqlNote);
    } finally {
        client.release();
    }
}

export async function createUser(email: string, password: string) {
    await ensureTables();
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            throw Object.assign(new Error('Email already in use'), { status: 409 });
        }
        const hash = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await client.query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [id, email, hash]);
        return { id, email };
    } finally {
        client.release();
    }
}

export async function signInUser(email: string, password: string): Promise<string | null> {
    await ensureTables();
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return null;
        const user = result.rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        return token;
    } finally {
        client.release();
    }
}

export async function findUserById(id: string) {
    await ensureTables();
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, email FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    } finally {
        client.release();
    }
}