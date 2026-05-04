import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

MessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
