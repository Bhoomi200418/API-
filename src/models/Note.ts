import mongoose, { Schema, Document } from "mongoose";

interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: false }, // Optional if category isn't mandatory
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // ✅ Automatically adds createdAt and updatedAt
);

export default mongoose.model<INote>("Note", NoteSchema);
