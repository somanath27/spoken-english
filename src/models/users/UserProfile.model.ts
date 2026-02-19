import { IUserProfile } from '@/interfaces/users/UserProfile.interface';
import { Schema, model } from 'mongoose';

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    nativeLanguage: {
      type: String,
      required: true,
      trim: true,
    },
    targetLanguage: {
      type: String,
      default: 'English',
      trim: true,
    },
    dailyGoalMinutes: {
      type: Number,
      default: 10,
      min: 5,
      max: 120,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
    reminderTime: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index on userId for fast lookups
UserProfileSchema.index({ userId: 1 });

export const UserProfileModel = model<IUserProfile>('UserProfile', UserProfileSchema);