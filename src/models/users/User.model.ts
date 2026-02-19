import { IUser } from '@/interfaces/users/User.interface';
import { Schema, model } from 'mongoose';

const UserSchema = new Schema<IUser>(
    {
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
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
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