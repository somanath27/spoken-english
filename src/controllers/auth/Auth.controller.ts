import { Request, Response } from 'express';
import { registerUser, loginUser, getMe } from '../../services/auth/Auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, nativeLanguage, password } = req.body;

        if (!password) {
            res.status(400).json({ success: false, message: 'Password is required' });
            return;
        }

        if (!email) {
            res
                .status(400)
                .json({ success: false, message: 'Email is required' });
            return;
        }

        const result = await registerUser({ fullName, email, nativeLanguage, password });

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
    // Extend this later with a token blacklist if needed.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
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