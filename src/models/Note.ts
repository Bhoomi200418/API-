// import mongoose, { Schema, Document } from "mongoose";

// interface INote extends Document {
//   userId: mongoose.Types.ObjectId;
//   title: string;
//   content: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const NoteSchema: Schema = new Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     category: { type: String, required: false }, // Optional if category isn't mandatory
//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true } // ✅ Automatically adds createdAt and updatedAt
// );

// export default mongoose.model<INote>("Note", NoteSchema);
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
    userId: { type: Schema.Types.ObjectId, required: true },
    date: { type: Date, required: true, default: new Date() },
  },
  { timestamps: true }
);


export const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);

















