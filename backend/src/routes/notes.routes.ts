import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createNote, deleteNote, getNotes, updateNote } from '../controllers/notes.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(getNotes));
router.post('/', asyncHandler(createNote));
router.put('/:id', asyncHandler(updateNote));
router.delete('/:id', asyncHandler(deleteNote));

export default router;
