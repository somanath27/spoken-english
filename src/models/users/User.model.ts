import { IUser } from '@/interfaces/users/User.interface';
import { Schema, model } from 'mongoose';

const UserSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        nativeLanguage: {
            type: String,
            required: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        streak: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPoints: {
            type: Number,
            default: 0,
            min: 0,
        },
        level: {
            type: String,
            enum: ['beginner', 'pro'],
            default: 'beginner'
        },
        resetToken: {
            type: String,
            default: null,
        },
        resetTokenExpiry: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

UserSchema.pre('validate', function (next) {
    if (this.email) {
        next();
    } else {
        next(new Error('At least email is required'));
    }
});

export const UserModel = model<IUser>('User', UserSchema);