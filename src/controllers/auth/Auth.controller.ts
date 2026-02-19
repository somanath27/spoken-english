import { Request, Response } from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword,
} from '../../services/auth/Auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, phone, email, nativeLanguage, password } = req.body;

        if (!password) {
            res.status(400).json({ success: false, message: 'Password is required' });
            return;
        }

        if (!fullName) {
            res.status(400).json({ success: false, message: 'Full name is required' });
            return;
        }

        if (!nativeLanguage) {
            res.status(400).json({ success: false, message: 'Native language is required' });
            return;
        }

        if (!phone && !email) {
            res
                .status(400)
                .json({ success: false, message: 'Phone or email is required' });
            return;
        }

        const result = await registerUser({ fullName, phone, email, nativeLanguage, password });

        res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({ success: false, message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, email, password } = req.body;

        if (!password) {
            res.status(400).json({ success: false, message: 'Password is required' });
            return;
        }

        if (!phone && !email) {
            res
                .status(400)
                .json({ success: false, message: 'Phone or email is required' });
            return;
        }

        const result = await loginUser({ phone, email, password });

        res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ success: false, message });
    }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    // JWT is stateless — logout is handled client-side by discarding the token.
    // Extend this later with a token blacklist if needed.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user is attached by the auth middleware
        const userId = (req as Request & { user?: { userId: string } }).user
            ?.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await getMe(userId);

        res.status(200).json({ success: true, data: user });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Failed to fetch user';
        res.status(404).json({ success: false, message });
    }
};

export const forgotPasswordHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const result = await forgotPassword({ email });

        res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Failed to process request';
        res.status(400).json({ success: false, message });
    }
};

export const resetPasswordHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res
                .status(400)
                .json({ success: false, message: 'Token and new password are required' });
            return;
        }

        const result = await resetPassword({ token, newPassword });

        res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Failed to reset password';
        res.status(400).json({ success: false, message });
    }
};

export const changePasswordHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as Request & { user?: { userId: string } }).user
            ?.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res
                .status(400)
                .json({
                    success: false,
                    message: 'Old password and new password are required',
                });
            return;
        }

        const result = await changePassword({ userId, oldPassword, newPassword });

        res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Failed to change password';
        res.status(400).json({ success: false, message });
    }
};