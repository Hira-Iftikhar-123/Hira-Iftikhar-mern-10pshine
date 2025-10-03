import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { notesService } from '../services/notes.service';

const noteSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional().default('')
});

export async function getNotes(req: AuthRequest, res: Response) {
    const notes = await notesService.listUserNotes(req.userId!);
    res.json(notes);
}

export async function createNote(req: AuthRequest, res: Response) {
    const parse = noteSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
    const note = await notesService.createNote(req.userId!, parse.data);
    res.status(201).json(note);
}

export async function updateNote(req: AuthRequest, res: Response) {
    const parse = noteSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
    const note = await notesService.updateNote(req.userId!, req.params.id, parse.data);
    res.json(note);
}

export async function deleteNote(req: AuthRequest, res: Response) {
    await notesService.deleteNote(req.userId!, req.params.id);
    res.status(204).send();
}


