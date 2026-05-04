import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  imageUrl: string;
  caption?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, maxlength: 2200 },
  },
  { timestamps: true }
);

PostSchema.index({ userId: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>("Post", PostSchema);
