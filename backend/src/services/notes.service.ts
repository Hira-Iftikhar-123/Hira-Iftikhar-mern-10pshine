import mysql from 'mysql2/promise';
import crypto from 'node:crypto';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });

export const notesService = {
    async listUserNotes(userId: string) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT id, title, content FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
            return Array.isArray(rows) ? rows : [];
        } finally {
            conn.release();
        }
    },
    async createNote(userId: string, data: { title: string; content?: string }) {
        const conn = await pool.getConnection();
        try {
            const id = crypto.randomUUID();
            await conn.execute('INSERT INTO notes (id, title, content, user_id) VALUES (?, ?, ?, ?)', [id, data.title, data.content || '', userId]);
            return { id, title: data.title, content: data.content || '' };
        } finally {
            conn.release();
        }
    },
    async updateNote(userId: string, id: string, data: { title?: string; content?: string }) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT user_id FROM notes WHERE id = ?', [id]);
            const note = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;
            if (!note || note.user_id !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
            await conn.execute('UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?', [data.title ?? null, data.content ?? null, id]);
            const [after] = await conn.execute('SELECT id, title, content FROM notes WHERE id = ?', [id]);
            return Array.isArray(after) && after.length ? (after[0] as any) : { id, title: data.title, content: data.content };
        } finally {
            conn.release();
        }
    },
    async deleteNote(userId: string, id: string) {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.execute('SELECT user_id FROM notes WHERE id = ?', [id]);
            const note = Array.isArray(rows) && rows.length ? (rows[0] as any) : null;
            if (!note || note.user_id !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
            await conn.execute('DELETE FROM notes WHERE id = ?', [id]);
        } finally {
            conn.release();
        }
    }
};


