import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for TypeScript
interface IBlacklistedToken extends Document {
  token: string;
  createdAt: Date;
}

// Define the Schema
const BlacklistedTokenSchema: Schema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // Automatically deletes after 1 hour
  },
  { timestamps: true }
);

// Create the Model
const BlacklistedToken: Model<IBlacklistedToken> = mongoose.model<IBlacklistedToken>(
  "BlacklistedToken",
  BlacklistedTokenSchema
);

export default BlacklistedToken;
