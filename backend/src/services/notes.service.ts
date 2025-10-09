import { Pool } from 'pg';
import crypto from 'node:crypto';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'Notes_App',
    max: 10
});

export const notesService = {
    async listUserNotes(userId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
            return result.rows;
        } finally {
            client.release();
        }
    },
    async createNote(userId: string, data: { title: string; content?: string }) {
        const client = await pool.connect();
        try {
            const id = crypto.randomUUID();
            await client.query('INSERT INTO notes (id, title, content, user_id) VALUES ($1, $2, $3, $4)', [id, data.title, data.content || '', userId]);
            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    },
    async updateNote(userId: string, id: string, data: { title?: string; content?: string }) {
        const client = await pool.connect();
        try {
            const checkResult = await client.query('SELECT user_id FROM notes WHERE id = $1', [id]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                throw Object.assign(new Error('Not found'), { status: 404 });
            }

            const fieldsToUpdate: string[] = [];
            const values: any[] = [];

            if (data.title !== undefined) {
                fieldsToUpdate.push('title = $' + (values.length + 1));
                values.push(data.title);
            }
            if (data.content !== undefined) {
                fieldsToUpdate.push('content = $' + (values.length + 1));
                values.push(data.content);
            }

            if (fieldsToUpdate.length === 0) {
                const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
                return result.rows[0];
            }

            values.push(id);
            // always bump updated_at on updates
            fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
            const query = `UPDATE notes SET ${fieldsToUpdate.join(', ')} WHERE id = $${values.length}`;
            await client.query(query, values);
            
            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    },
    async deleteNote(userId: string, id: string) {
        const client = await pool.connect();
        try {
            const checkResult = await client.query('SELECT user_id FROM notes WHERE id = $1', [id]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                throw Object.assign(new Error('Not found'), { status: 404 });
            }
            await client.query('DELETE FROM notes WHERE id = $1', [id]);
        } finally {
            client.release();
        }
    }
};