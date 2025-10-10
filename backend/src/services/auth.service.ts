import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import logger from '../utils/logger';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'Notes_App',
    max: 10
});

export async function ensureTables() {
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
        logger.info({
            type: 'user_activity',
            action: 'user_creation_attempt',
            email,
            timestamp: new Date().toISOString()
        }, `User creation attempt for email: ${email}`);

        const result = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            logger.warn({
                type: 'user_activity',
                action: 'user_creation_failed',
                reason: 'email_already_exists',
                email,
                timestamp: new Date().toISOString()
            }, `User creation failed - email already exists: ${email}`);
            throw Object.assign(new Error('Email already in use'), { status: 409 });
        }
        
        const hash = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await client.query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [id, email, hash]);
        
        logger.info({
            type: 'user_activity',
            action: 'user_created',
            userId: id,
            email,
            timestamp: new Date().toISOString()
        }, `User created successfully: ${email}`);
        
        return { id, email };
    } finally {
        client.release();
    }
}

export async function signInUser(email: string, password: string): Promise<string | null> {
    await ensureTables();
    const client = await pool.connect();
    try {
        logger.info({
            type: 'user_activity',
            action: 'login_attempt',
            email,
            timestamp: new Date().toISOString()
        }, `Login attempt for email: ${email}`);

        const result = await client.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            logger.warn({
                type: 'user_activity',
                action: 'login_failed',
                reason: 'user_not_found',
                email,
                timestamp: new Date().toISOString()
            }, `Login failed - user not found: ${email}`);
            return null;
        }
        
        const user = result.rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            logger.warn({
                type: 'user_activity',
                action: 'login_failed',
                reason: 'invalid_password',
                userId: user.id,
                email,
                timestamp: new Date().toISOString()
            }, `Login failed - invalid password for: ${email}`);
            return null;
        }
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        
        logger.info({
            type: 'user_activity',
            action: 'login_success',
            userId: user.id,
            email,
            timestamp: new Date().toISOString()
        }, `Login successful for: ${email}`);
        
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
        if (result.rows.length === 0) {
            logger.warn({
                type: 'user_activity',
                action: 'user_lookup_failed',
                userId: id,
                timestamp: new Date().toISOString()
            }, `User lookup failed - user not found: ${id}`);
            return null;
        }
        
        logger.debug({
            type: 'user_activity',
            action: 'user_lookup_success',
            userId: id,
            timestamp: new Date().toISOString()
        }, `User lookup successful: ${id}`);
        
        return result.rows[0];
    } finally {
        client.release();
    }
}