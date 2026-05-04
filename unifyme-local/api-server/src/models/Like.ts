import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Like = mongoose.model<ILike>("Like", LikeSchema);
