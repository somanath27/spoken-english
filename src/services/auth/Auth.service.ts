import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    IUserRegisterInput,
    IUserLoginInput,
    IAuthResponse,
    IAuthTokenPayload,
    IForgotPasswordInput,
    IResetPasswordInput,
    IChangePasswordInput,
} from '../../interfaces/users/User.interface';
import { UserModel } from '@/models/users/User.model';
import crypto from 'node:crypto';
import { getPasswordResetEmailTemplate, sendEmail } from '@/utils/Email.util';

const SALT_ROUNDS = 10;

const signToken = (payload: IAuthTokenPayload): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

    if (!secret) throw new Error('JWT_SECRET is not defined in environment');

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const registerUser = async (
    input: IUserRegisterInput
): Promise<IAuthResponse> => {
    const { fullName, email, nativeLanguage, password } = input;

    if (!email) {
        throw new Error('Email is required');
    }

    // Check duplicate
    const existingUser = await UserModel.findOne({
        $or: [
            ...(email ? [{ email }] : []),
        ],
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserModel.create({
        email,
        fullName,
        nativeLanguage,
        passwordHash,
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return {
        token,
        user: {
            id: user._id.toString(),
            phone: user.phone,
            nativeLanguage: user.nativeLanguage,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            streak: user.streak,
            totalPoints: user.totalPoints,
            level: user.level
        },
    };
};

export const loginUser = async (
    input: IUserLoginInput
): Promise<IAuthResponse> => {
    const { phone, email, password } = input;

    if (!phone && !email) {
        throw new Error('Phone or email is required');
    }

    const user = await UserModel.findOne({
        $or: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
        ],
    });

    if (!user || !user.isActive) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return {
        token,
        user: {
            id: user._id.toString(),
            phone: user.phone,
            nativeLanguage: user.nativeLanguage,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            streak: user.streak,
            totalPoints: user.totalPoints,
            level: user.level
        },
    };
};

export const getMe = async (userId: string) => {
    const user = await UserModel.findById(userId).select(
        '-passwordHash -__v'
    );

    if (!user) throw new Error('User not found');

    return user;
};

export const forgotPassword = async (
    input: IForgotPasswordInput
): Promise<{ message: string }> => {
    const { email } = input;

    const user = await UserModel.findOne({ email, isActive: true });

    if (!user) {
        return { message: 'If this email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = hashedToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: getPasswordResetEmailTemplate(
                user?.fullName || 'User',
                resetUrl
            ),
        });
    } catch (error) {
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        throw new Error('Failed to send reset email. Please try again later.');
    }

    return { message: 'Password reset link sent to your email' };
};

export const resetPassword = async (
    input: IResetPasswordInput
): Promise<{ message: string }> => {
    const { token, newPassword } = input;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserModel.findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() },
        isActive: true,
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return { message: 'Password reset successful' };
};

export const changePassword = async (
    input: IChangePasswordInput
): Promise<{ message: string }> => {
    const { userId, oldPassword, newPassword } = input;

    const user = await UserModel.findById(userId);

    if (!user || !user.isActive) {
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    await user.save();

    return { message: 'Password changed successfully' };
};