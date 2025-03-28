import mongoose, { Schema, Document, Model } from "mongoose";

export interface INote extends Document {
  title?: string;
  content?: string;
  category?: string;
  userId: mongoose.Schema.Types.ObjectId;
  date: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String },
    content: { type: String },
    category: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now }, 
  },
  { timestamps: true }
);

export const Note: Model<INote> = mongoose.model<INote>("Note", NoteSchema);
