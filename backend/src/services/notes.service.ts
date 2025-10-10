import { Pool } from 'pg';
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

export const notesService = {
    async listUserNotes(userId: string) 
    {
        const client = await pool.connect();
        try {
            logger.info({
                type: 'note_activity',
                action: 'list_notes',
                userId,
                timestamp: new Date().toISOString()
            }, `User ${userId} listing notes`);

            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
            
            logger.info({
                type: 'note_activity',
                action: 'list_notes_success',
                userId,
                noteCount: result.rows.length,
                timestamp: new Date().toISOString()
            }, `User ${userId} retrieved ${result.rows.length} notes`);
            
            return result.rows;
        } finally {
            client.release();
        }
    },
    async createNote(userId: string, data: { title: string; content?: string }) {
        const client = await pool.connect();
        try {
            const id = crypto.randomUUID();
            
            logger.info({
                type: 'note_activity',
                action: 'create_note',
                userId,
                noteId: id,
                title: data.title,
                timestamp: new Date().toISOString()
            }, `User ${userId} creating note: ${data.title}`);

            await client.query('INSERT INTO notes (id, title, content, user_id) VALUES ($1, $2, $3, $4)', [id, data.title, data.content || '', userId]);
            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
            
            logger.info({
                type: 'note_activity',
                action: 'create_note_success',
                userId,
                noteId: id,
                title: data.title,
                timestamp: new Date().toISOString()
            }, `User ${userId} created note successfully: ${data.title}`);
            
            return result.rows[0];
        } finally {
            client.release();
        }
    },
    async updateNote(userId: string, id: string, data: { title?: string; content?: string }) {
        const client = await pool.connect();
        try {
            logger.info({
                type: 'note_activity',
                action: 'update_note',
                userId,
                noteId: id,
                fieldsToUpdate: Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined),
                timestamp: new Date().toISOString()
            }, `User ${userId} updating note ${id}`);

            const checkResult = await client.query('SELECT user_id FROM notes WHERE id = $1', [id]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                logger.warn({
                    type: 'note_activity',
                    action: 'update_note_failed',
                    reason: 'note_not_found_or_unauthorized',
                    userId,
                    noteId: id,
                    timestamp: new Date().toISOString()
                }, `User ${userId} failed to update note ${id} - not found or unauthorized`);
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
                logger.debug({
                    type: 'note_activity',
                    action: 'update_note_no_changes',
                    userId,
                    noteId: id,
                    timestamp: new Date().toISOString()
                }, `User ${userId} update note ${id} - no changes made`);
                const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
                return result.rows[0];
            }

            values.push(id);
            // always bump updated_at on updates
            fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
            const query = `UPDATE notes SET ${fieldsToUpdate.join(', ')} WHERE id = $${values.length}`;
            await client.query(query, values);
            
            const result = await client.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1', [id]);
            
            logger.info({
                type: 'note_activity',
                action: 'update_note_success',
                userId,
                noteId: id,
                updatedFields: fieldsToUpdate,
                timestamp: new Date().toISOString()
            }, `User ${userId} updated note ${id} successfully`);
            
            return result.rows[0];
        } finally {
            client.release();
        }
    },
    async deleteNote(userId: string, id: string) {
        const client = await pool.connect();
        try {
            logger.info({
                type: 'note_activity',
                action: 'delete_note',
                userId,
                noteId: id,
                timestamp: new Date().toISOString()
            }, `User ${userId} deleting note ${id}`);

            const checkResult = await client.query('SELECT user_id FROM notes WHERE id = $1', [id]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                logger.warn({
                    type: 'note_activity',
                    action: 'delete_note_failed',
                    reason: 'note_not_found_or_unauthorized',
                    userId,
                    noteId: id,
                    timestamp: new Date().toISOString()
                }, `User ${userId} failed to delete note ${id} - not found or unauthorized`);
                throw Object.assign(new Error('Not found'), { status: 404 });
            }
            
            await client.query('DELETE FROM notes WHERE id = $1', [id]);
            
            logger.info({
                type: 'note_activity',
                action: 'delete_note_success',
                userId,
                noteId: id,
                timestamp: new Date().toISOString()
            }, `User ${userId} deleted note ${id} successfully`);
        } finally {
            client.release();
        }
    }
};