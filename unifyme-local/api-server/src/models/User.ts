import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  displayName?: string;
  bio?: string;
  email?: string;
  passwordHash: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-zA-Z0-9_]+$/,
      minlength: 3,
      maxlength: 30,
    },
    displayName: { type: String, maxlength: 50 },
    bio: { type: String, maxlength: 300 },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profileImageUrl: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
