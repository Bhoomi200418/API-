import mongoose, { Schema, Document, Model } from "mongoose";

interface IUser extends Document {
    _id: mongoose.Types.ObjectId; // ✅ Explicitly define _id
    email: string;
    password: string;
    otp?: string;
    otpExpiresAt?: Date;
    reset_password_otp?: string;
    reset_password_otp_time?: Date;
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        otp: { type: String },
        otpExpiresAt: { type: Date },
        reset_password_otp: { type: String },
        reset_password_otp_time: { type: Date },
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
