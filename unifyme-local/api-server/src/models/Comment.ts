import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2200 },
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
