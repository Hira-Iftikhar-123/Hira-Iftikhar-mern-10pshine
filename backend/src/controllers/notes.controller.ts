import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { notesService } from '../services/notes.service';
import logger from '../utils/logger';

const noteSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional().default('')
});

export async function getNotes(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    try {
        logger.info({
            type: 'notes_controller',
            action: 'get_notes',
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} requesting notes list`);

        const notes = await notesService.listUserNotes(userId);
        
        logger.info({
            type: 'notes_controller',
            action: 'get_notes_success',
            userId,
            noteCount: notes.length,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} retrieved ${notes.length} notes successfully`);
        
        res.json(notes);
    } catch (error: any) {
        logger.error({
            type: 'notes_controller',
            action: 'get_notes_error',
            userId,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Error retrieving notes for user ${userId}`);
        throw error;
    }
}

export async function createNote(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const parse = noteSchema.safeParse(req.body);
    
    if (!parse.success) {
        logger.warn({
            type: 'notes_controller',
            action: 'create_note_validation_failed',
            userId,
            errors: parse.error.issues,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Note creation validation failed for user ${userId}`);
        return res.status(400).json({ error: 'Invalid input' });
    }
    
    try {
        logger.info({
            type: 'notes_controller',
            action: 'create_note',
            userId,
            title: parse.data.title,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} creating note: ${parse.data.title}`);

        const note = await notesService.createNote(userId, parse.data);
        
        logger.info({
            type: 'notes_controller',
            action: 'create_note_success',
            userId,
            noteId: note.id,
            title: note.title,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} created note successfully: ${note.title}`);
        
        res.status(201).json(note);
    } catch (error: any) {
        logger.error({
            type: 'notes_controller',
            action: 'create_note_error',
            userId,
            title: parse.data.title,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Error creating note for user ${userId}`);
        throw error;
    }
}

export async function updateNote(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const noteId = req.params.id;
    const parse = noteSchema.partial().safeParse(req.body);
    
    if (!parse.success) {
        logger.warn({
            type: 'notes_controller',
            action: 'update_note_validation_failed',
            userId,
            noteId,
            errors: parse.error.issues,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Note update validation failed for user ${userId}, note ${noteId}`);
        return res.status(400).json({ error: 'Invalid input' });
    }
    
    try {
        logger.info({
            type: 'notes_controller',
            action: 'update_note',
            userId,
            noteId,
            fieldsToUpdate: Object.keys(parse.data),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} updating note ${noteId}`);

        const note = await notesService.updateNote(userId, noteId, parse.data);
        
        logger.info({
            type: 'notes_controller',
            action: 'update_note_success',
            userId,
            noteId: note.id,
            title: note.title,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} updated note ${noteId} successfully`);
        
        res.json(note);
    } catch (error: any) {
        logger.error({
            type: 'notes_controller',
            action: 'update_note_error',
            userId,
            noteId,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Error updating note ${noteId} for user ${userId}`);
        throw error;
    }
}

export async function deleteNote(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const noteId = req.params.id;
    
    try {
        logger.info({
            type: 'notes_controller',
            action: 'delete_note',
            userId,
            noteId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} deleting note ${noteId}`);
        await notesService.deleteNote(userId, noteId);
        
        logger.info({
            type: 'notes_controller',
            action: 'delete_note_success',
            userId,
            noteId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `User ${userId} deleted note ${noteId} successfully`);
        
        res.status(204).send();
    } catch (error: any) {
        logger.error({
            type: 'notes_controller',
            action: 'delete_note_error',
            userId,
            noteId,
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, `Error deleting note ${noteId} for user ${userId}`);
        throw error;
    }
}