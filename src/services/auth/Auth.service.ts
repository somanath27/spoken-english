import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    IUserRegisterInput,
    IUserLoginInput,
    IAuthResponse,
    IAuthTokenPayload,
} from '../../interfaces/users/User.interface';
import { UserModel } from '@/models/users/User.model';

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
        user:{
            id: user._id.toString(),
            phone: user.phone,
            nativeLanguage: user.nativeLanguage,
            email: user.email,
            fullName: user.fullName,
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