import { Request, Response } from 'express';
import { z } from 'zod';
import { signInUser, createUser, findUserById, findUserByEmail, updateUser, deleteUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { storeOTP, verifyOTP as verifyOTPService } from '../services/otp.service';
import { sendPasswordResetOTP, sendPasswordResetSuccess } from '../services/email.service';

function formatZodErrors(error: z.ZodError<unknown>): { field: string; message: string }[] {
    return error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}

const credentialsSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    profilePicture: z.string().optional()
});

export async function signup(req: Request, res: Response) {
    const parse = signupSchema.safeParse(req.body);

    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }

    const { email, password, name, profilePicture } = parse.data;
    const user = await createUser(email, password, name, profilePicture);

    return res.status(201).json({ id: user.id, email: user.email, name: user.name, profilePicture: user.profilePicture });
}


export async function login(req: Request, res: Response) {
    const parse = credentialsSchema.safeParse(req.body);
    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }
    const { email, password } = parse.data;
    const token = await signInUser(email, password);
    if (!token) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.json({ token });
}

export async function me(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json({ id: user.id, email: user.email, name: user.name, profilePicture: user.profilePicture });
}

const profileUpdateSchema = z.object({
    name: z.string().optional(),
    profilePicture: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional()
});

const forgotPasswordSchema = z.object({
    email: z.email('Invalid email')
});

const verifyOTPSchema = z.object({
    email: z.email('Invalid email'),
    otp: z.string().length(6, 'OTP must be 6 digits')
});

const resetPasswordSchema = z.object({
    email: z.email('Invalid email'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export async function updateProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const parse = profileUpdateSchema.safeParse(req.body);

    if (!parse.success) {
        const formattedErrors = formatZodErrors(parse.error);
        return res.status(400).json({ errors: formattedErrors });
    }

    const { name, profilePicture, currentPassword, newPassword } = parse.data;
    
    try {
        logger.info({
            type: 'user_activity',
            action: 'profile_update',
            userId,
            fieldsToUpdate: Object.keys(parse.data).filter(key => parse.data[key as keyof typeof parse.data] !== undefined),
            timestamp: new Date().toISOString()
        }, `User ${userId} updating profile`);

        const updatedUser = await updateUser(userId, { name, profilePicture, currentPassword, newPassword });
        
        logger.info({
            type: 'user_activity',
            action: 'profile_update_success',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} profile updated successfully`);
        
        res.json({ id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, profilePicture: updatedUser.profilePicture });
    } catch (error: any) {
        logger.error({
            type: 'user_activity',
            action: 'profile_update_error',
            userId,
            error: error.message,
            timestamp: new Date().toISOString()
        }, `Error updating profile for user ${userId}`);
        throw error;
    }
}

export async function deleteProfile(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    
    try {
        logger.info({
            type: 'user_activity',
            action: 'account_deletion',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} deleting account`);

        await deleteUser(userId);
        
        logger.info({
            type: 'user_activity',
            action: 'account_deletion_success',
            userId,
            timestamp: new Date().toISOString()
        }, `User ${userId} account deleted successfully`);
        
        res.status(204).send();
    } catch (error: any) {
        logger.error({
            type: 'user_activity',
            action: 'account_deletion_error',
            userId,
            error: error.message,
            timestamp: new Date().toISOString()
        }, `Error deleting account for user ${userId}`);
        throw error;
    }
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        console.log('Forgot password request received:', req.body);
        const parse = forgotPasswordSchema.safeParse(req.body);
        
        if (!parse.success) {
            const formattedErrors = formatZodErrors(parse.error);
            logger.warn({
                type: 'auth_activity',
                action: 'forgot_password_validation_failed',
                errors: formattedErrors,
                timestamp: new Date().toISOString()
            }, 'Forgot password validation failed');
            return res.status(400).json({ errors: formattedErrors });
        }

        const { email } = parse.data;
        
        // Check if user exists
        const user = await findUserByEmail(email);
        if (!user) {
            logger.warn({
                type: 'auth_activity',
                action: 'forgot_password_user_not_found',
                email,
                timestamp: new Date().toISOString()
            }, `Forgot password request for non-existent user: ${email}`);
            // Don't reveal if user exists or not for security
            return res.json({ message: 'If the email exists, an OTP has been sent' });
        }

        // Generate and store OTP
        const otp = storeOTP(email);
        
        // Send OTP email
        const emailSent = await sendPasswordResetOTP(email, otp, user.name);
        
        if (!emailSent) {
            logger.error({
                type: 'auth_activity',
                action: 'forgot_password_email_failed',
                email,
                timestamp: new Date().toISOString()
            }, `Failed to send password reset email to: ${email}`);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        logger.info({
            type: 'auth_activity',
            action: 'forgot_password_otp_sent',
            email,
            timestamp: new Date().toISOString()
        }, `Password reset OTP sent to: ${email}`);

        res.json({ message: 'If the email exists, an OTP has been sent' });
    } catch (error: any) {
        logger.error({
            type: 'auth_activity',
            action: 'forgot_password_error',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 'Error in forgot password request');
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function verifyOTP(req: Request, res: Response) {
    try {
        const parse = verifyOTPSchema.safeParse(req.body);
        
        if (!parse.success) {
            const formattedErrors = formatZodErrors(parse.error);
            logger.warn({
                type: 'auth_activity',
                action: 'verify_otp_validation_failed',
                errors: formattedErrors,
                timestamp: new Date().toISOString()
            }, 'OTP verification validation failed');
            return res.status(400).json({ errors: formattedErrors });
        }

        const { email, otp } = parse.data;
        
        const result = verifyOTPService(email, otp);        
        if (!result.valid) {
            logger.warn({
                type: 'auth_activity',
                action: 'verify_otp_failed',
                email,
                timestamp: new Date().toISOString()
            }, `OTP verification failed for: ${email}`);
            return res.status(400).json({ error: result.message });
        }

        logger.info({
            type: 'auth_activity',
            action: 'verify_otp_success',
            email,
            timestamp: new Date().toISOString()
        }, `OTP verified successfully for: ${email}`);

        res.json({ message: 'OTP verified successfully' });
    } catch (error: any) {
        logger.error({
            type: 'auth_activity',
            action: 'verify_otp_error',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 'Error in OTP verification');
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const parse = resetPasswordSchema.safeParse(req.body);
        
        if (!parse.success) {
            const formattedErrors = formatZodErrors(parse.error);
            logger.warn({
                type: 'auth_activity',
                action: 'reset_password_validation_failed',
                errors: formattedErrors,
                timestamp: new Date().toISOString()
            }, 'Reset password validation failed');
            return res.status(400).json({ errors: formattedErrors });
        }

        const { email, otp, newPassword } = parse.data;
        
        // Verify OTP first
        const otpResult = verifyOTPService(email, otp);
        if (!otpResult.valid) {
            logger.warn({
                type: 'auth_activity',
                action: 'reset_password_otp_invalid',
                email,
                timestamp: new Date().toISOString()
            }, `Reset password failed - invalid OTP for: ${email}`);
            return res.status(400).json({ error: otpResult.message });
        }

        // Find user and update password
        const user = await findUserByEmail(email);
        if (!user) {
            logger.warn({
                type: 'auth_activity',
                action: 'reset_password_user_not_found',
                email,
                timestamp: new Date().toISOString()
            }, `Reset password failed - user not found: ${email}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Update password
        await updateUser(user.id, { newPassword });
        
        // Send success email
        await sendPasswordResetSuccess(email, user.name);
        
        logger.info({
            type: 'auth_activity',
            action: 'reset_password_success',
            email,
            userId: user.id,
            timestamp: new Date().toISOString()
        }, `Password reset successful for: ${email}`);

        res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        logger.error({
            type: 'auth_activity',
            action: 'reset_password_error',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 'Error in password reset');
        res.status(500).json({ error: 'Internal server error' });
    }
}


