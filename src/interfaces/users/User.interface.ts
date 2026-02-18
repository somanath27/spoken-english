import { Document, Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
    _id: Types.ObjectId;
    fullName: string;
    phone: string;
    email: string;
    passwordHash: string;
    nativeLanguage: string;
    streak: number;
    level: string;
    totalPoints: number;
    resetToken?: string | null;
    resetTokenExpiry?: Date | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserRegisterInput {
    fullName: string;
    email: string;
    nativeLanguage: string;
    password: string;
}

export interface IUserLoginInput {
    phone?: string;
    email: string;
    password: string;
}

export interface IAuthTokenPayload {
    userId: string;
    role: UserRole;
}

export interface IAuthResponse {
    token: string;
    user: {
        id: string;
        phone?: string;
        email: string;
        role: UserRole;
        fullName: string;
        nativeLanguage: string;
        streak: number;
        totalPoints: number;
        level: string;
    };
}


export interface IForgotPasswordInput {
  email: string;
}

export interface IResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface IChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}