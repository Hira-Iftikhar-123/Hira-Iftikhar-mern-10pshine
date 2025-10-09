import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createNote, deleteNote, getNotes, updateNote } from '../controllers/notes.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;