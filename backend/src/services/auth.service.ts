import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });

async function ensureTables() {
    const sqlUser = `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;
    const sqlNote = `CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;
    const conn = await pool.getConnection();
    try {
        await conn.execute(sqlUser);
        await conn.execute(sqlNote);
    } finally {
        conn.release();
    }
}

export async function createUser(email: string, password: string) {
    await ensureTables();
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
        const exists = Array.isArray(rows) && rows.length > 0;
        if (exists) throw Object.assign(new Error('Email already in use'), { status: 409 });
        const hash = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await conn.execute('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, hash]);
        return { id, email };
    } finally {
        conn.release();
    }
}

export async function signInUser(email: string, password: string): Promise<string | null> {
    await ensureTables();
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.execute('SELECT id, password_hash FROM users WHERE email = ?', [email]);
        const user = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        return token;
    } finally {
        conn.release();
    }
}


