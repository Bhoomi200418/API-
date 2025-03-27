
import mongoose, { Schema, Document, Model } from 'mongoose';


export interface INote extends Document {
  title?: string;
  content?: string;
  category?: string; 
  userId: mongoose.Schema.Types.ObjectId;
  date: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: false },
    content: { type: String, required: false },
    category: { type: String, required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: new Date() },
  },
  { timestamps: true }
);


export const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);

















