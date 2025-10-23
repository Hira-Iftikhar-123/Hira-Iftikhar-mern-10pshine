import { Router } from 'express';
import { login, signup, me, updateProfile, deleteProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.put('/profile', requireAuth, asyncHandler(updateProfile));
router.delete('/profile', requireAuth, asyncHandler(deleteProfile));

export default router;
