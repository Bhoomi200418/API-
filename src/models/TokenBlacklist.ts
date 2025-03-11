import mongoose, { Schema, Document } from "mongoose";

interface ITokenBlacklist extends Document {
    token: string;
    createdAt: Date;
}

const TokenBlacklistSchema: Schema = new Schema(
    {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: "1h" } // ✅ Expires tokens after 1 hour
    }
);

export const TokenBlacklist = mongoose.model<ITokenBlacklist>("TokenBlacklist", TokenBlacklistSchema);
