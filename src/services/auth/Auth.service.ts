import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { UserModel } from '../../models/users/User.model';
import { UserProfileModel } from '../../models/users/UserProfile.model';
import {
    IUserRegisterInput,
    IUserLoginInput,
    IAuthResponse,
    IAuthTokenPayload,
    IForgotPasswordInput,
    IResetPasswordInput,
    IChangePasswordInput,
} from '../../interfaces/users/User.interface';
import {
    sendEmail,
    getPasswordResetEmailTemplate,
} from '../../utils/Email.util';

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
    const { fullName, phone, email, nativeLanguage, password } = input;

    if (!phone && !email) {
        throw new Error('Phone or email is required');
    }

    if (!fullName || !nativeLanguage) {
        throw new Error('Full name and native language are required');
    }

    // Check duplicate
    const existingUser = await UserModel.findOne({
        $or: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
        ],
    });

    if (existingUser) {
        throw new Error('User with this phone or email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserModel.create({
        phone,
        email,
        passwordHash,
    });

    // Create user profile
    await UserProfileModel.create({
        userId: user._id,
        fullName,
        nativeLanguage,
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return {
        token,
        user: {
            id: user._id.toString(),
            fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
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

    // Fetch user profile to get fullName
    const userProfile = await UserProfileModel.findOne({ userId: user._id });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return {
        token,
        user: {
            id: user._id.toString(),
            fullName: userProfile?.fullName || '',
            phone: user.phone,
            email: user.email,
            role: user.role,
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
        // Return success even if user doesn't exist (security best practice - prevents email enumeration)
        return { message: 'If this email exists, a reset link has been sent' };
    }

    // Fetch user profile to get name for email
    const userProfile = await UserProfileModel.findOne({ userId: user._id });

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = hashedToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: getPasswordResetEmailTemplate(
                userProfile?.fullName || 'User',
                resetUrl
            ),
        });
    } catch (error) {
        // Rollback token if email fails
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

    // Hash the incoming token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserModel.findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
        isActive: true,
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    // Update password
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

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    // Update to new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    await user.save();

    return { message: 'Password changed successfully' };
};