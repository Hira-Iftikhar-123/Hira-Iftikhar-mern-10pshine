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
            name VARCHAR(255),
            profile_picture TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        const sqlNote = `CREATE TABLE IF NOT EXISTS notes (
            id UUID PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            tags VARCHAR(500),
            user_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`;
        
        await client.query(sqlUser);
        await client.query(sqlNote);
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'notes' AND column_name = 'tags'
                ) THEN
                    ALTER TABLE notes ADD COLUMN tags VARCHAR(500);
                END IF;
            END $$;
        `);
    } finally {
        client.release();
    }
}

export async function createUser(email: string, password: string, name?: string, profilePicture?: string) {
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
        await client.query('INSERT INTO users (id, email, password_hash, name, profile_picture) VALUES ($1, $2, $3, $4, $5)', [id, email, hash, name || null, profilePicture || null]);
        
        logger.info({
            type: 'user_activity',
            action: 'user_created',
            userId: id,
            email,
            timestamp: new Date().toISOString()
        }, `User created successfully: ${email}`);
        
        return { id, email, name: name || null, profilePicture: profilePicture || null };
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
        const result = await client.query('SELECT id, email, name, profile_picture FROM users WHERE id = $1', [id]);
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
        
        const user = result.rows[0];
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePicture: user.profile_picture
        };
    } finally {
        client.release();
    }
}

export async function findUserByEmail(email: string) {
    await ensureTables();
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, email, name, profile_picture FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            logger.warn({
                type: 'user_activity',
                action: 'user_lookup_by_email_failed',
                email,
                timestamp: new Date().toISOString()
            }, `User lookup by email failed - user not found: ${email}`);
            return null;
        }
        
        logger.debug({
            type: 'user_activity',
            action: 'user_lookup_by_email_success',
            email,
            timestamp: new Date().toISOString()
        }, `User lookup by email successful: ${email}`);
        
        const user = result.rows[0];
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePicture: user.profile_picture
        };
    } finally {
        client.release();
    }
}

export async function updateUser(userId: string, data: { name?: string; profilePicture?: string; currentPassword?: string; newPassword?: string }) {
    await ensureTables();
    const client = await pool.connect();
    try {
        logger.info({
            type: 'user_activity',
            action: 'user_update',
            userId,
            fieldsToUpdate: Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined),
            timestamp: new Date().toISOString()
        }, `User ${userId} updating profile`);

        // Check if user exists
        const userResult = await client.query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            logger.warn({
                type: 'user_activity',
                action: 'user_update_failed',
                reason: 'user_not_found',
                userId,
                timestamp: new Date().toISOString()
            }, `User update failed - user not found: ${userId}`);
            throw Object.assign(new Error('User not found'), { status: 404 });
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        // Handle password change
        if (data.newPassword && data.currentPassword) {
            const user = userResult.rows[0];
            const isValidPassword = await bcrypt.compare(data.currentPassword, user.password_hash);
            if (!isValidPassword) {
                logger.warn({
                    type: 'user_activity',
                    action: 'user_update_failed',
                    reason: 'invalid_current_password',
                    userId,
                    timestamp: new Date().toISOString()
                }, `User update failed - invalid current password: ${userId}`);
                throw Object.assign(new Error('Invalid current password'), { status: 400 });
            }
            
            const newHash = await bcrypt.hash(data.newPassword, 10);
            fieldsToUpdate.push('password_hash = $' + (values.length + 1));
            values.push(newHash);
        }

        // Handle name update
        if (data.name !== undefined) {
            fieldsToUpdate.push('name = $' + (values.length + 1));
            values.push(data.name);
        }

        // Handle profile picture update
        if (data.profilePicture !== undefined) {
            fieldsToUpdate.push('profile_picture = $' + (values.length + 1));
            values.push(data.profilePicture);
        }

        if (fieldsToUpdate.length === 0) {
            logger.debug({
                type: 'user_activity',
                action: 'user_update_no_changes',
                userId,
                timestamp: new Date().toISOString()
            }, `User ${userId} update - no changes made`);
            const result = await client.query('SELECT id, email, name, profile_picture FROM users WHERE id = $1', [userId]);
            const user = result.rows[0];
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePicture: user.profile_picture
            };
        }

        values.push(userId);
        // Always bump updated_at on updates
        fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
        const query = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = $${values.length}`;
        await client.query(query, values);
        
        const result = await client.query('SELECT id, email, name, profile_picture FROM users WHERE id = $1', [userId]);
        
        logger.info({
            type: 'user_activity',
            action: 'user_update_success',
            userId,
            updatedFields: fieldsToUpdate,
            timestamp: new Date().toISOString()
        }, `User ${userId} updated successfully`);
        
        const user = result.rows[0];
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePicture: user.profile_picture
        };
    } finally {
        client.release();
    }
}

export async function deleteUser(userId: string) {
    await ensureTables();
    const client = await pool.connect();
    try {
        logger.info({
            type: 'user_activity',
            action: 'user_deletion',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} deleting account`);

        // Check if user exists
        const userResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            logger.warn({
                type: 'user_activity',
                action: 'user_deletion_failed',
                reason: 'user_not_found',
                userId,
                timestamp: new Date().toISOString()
            }, `User deletion failed - user not found: ${userId}`);
            throw Object.assign(new Error('User not found'), { status: 404 });
        }

        // Delete user (cascade will handle notes)
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        logger.info({
            type: 'user_activity',
            action: 'user_deletion_success',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} deleted successfully`);
    } finally {
        client.release();
    }
}