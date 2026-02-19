import { Document, Types } from 'mongoose';

export interface IUserProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  nativeLanguage: string;
  targetLanguage?: string;
  dailyGoalMinutes?: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfileInput {
  userId: string;
  fullName: string;
  nativeLanguage: string;
  targetLanguage?: string;
  dailyGoalMinutes?: number;
}