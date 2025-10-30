import { Router } from 'express';
import { login, signup, me, updateProfile, deleteProfile, forgotPassword, verifyOTP, resetPassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.put('/profile', requireAuth, asyncHandler(updateProfile));
router.delete('/profile', requireAuth, asyncHandler(deleteProfile));

// Password reset routes
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/verify-otp', asyncHandler(verifyOTP));
router.post('/reset-password', asyncHandler(resetPassword));

export default router;
