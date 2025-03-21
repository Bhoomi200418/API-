import mongoose, { Schema, Document, Model } from "mongoose";

interface IUser extends Document {
    email: string;
    password: string;
    otp?: string;
    otpExpiresAt?: Date;
    reset_password_token?: string;
    reset_password_token_time?: Date;
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        otp: { type: String },
        otpExpiresAt: { type: Date },
        reset_password_token: { type: String },
        reset_password_token_time: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
