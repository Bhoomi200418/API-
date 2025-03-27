import { Request, Response, NextFunction } from "express";
import User from "../models/User";

import { NodeMailer } from "../utils/NodeMailer";
import BlacklistedToken from "../models/BlacklistedToken";

import { Utils } from "../utils/Utils";

import { Jwt } from "../utils/Jwt";
import bcrypt from "bcryptjs";

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    password: string;
    type?: string;
  };
}

export class UserController {
  static async signup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hash = await Utils.encryptPassword(password);
      user.password = hash;
      await user.save();

      const payload = { email: user.email };
      const token = Jwt.jwtSign(payload, user._id.toString());

      return res.status(201).json({
        message: "Signup successful",
        token,
        user: user,
      });
    } catch (error) {
      console.error("Signup Error:", error);
      next(error); // ✅ Pass error to Express error handler
    }
  }

  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const payload = { email: user.email };
      const token = Jwt.jwtSign(payload, user._id.toString()); // ✅ Fixed here

      res.status(200).json({
        message: "Login successful",
        token,
        email: user.email,
        userId: user._id.toString(), // ✅ Ensure it's a string
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  static async userProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await User.findById(req.user._id).select("-password");
      res.json({ user });
    } catch (error) {
      console.error("User Profile Error:", error);
      next(error);
    }
  }

  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        res.status(400).json({ message: "Bad Request - No token provided" });
        return;
      }

      // Check if the token is already blacklisted
      const existingBlacklistedToken = await BlacklistedToken.findOne({
        token,
      });
      if (existingBlacklistedToken) {
        res.status(400).json({ message: "Token already blacklisted" });
        return;
      }

      // Add token to blacklist
      await BlacklistedToken.create({ token });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("❌ Logout error:", error);
      next(error); // ✅ Pass the error to Express error handler instead of returning a response
    }
  }

  static async sendOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

      // Find user and update OTP
      const user = await User.findOneAndUpdate(
        { email },
        { otp, otpExpiresAt: otpExpiry },
        { new: true, upsert: true }
      );

      console.log("User : ", user);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Send OTP via email using the NodeMailer class
      await NodeMailer.sendMail({
        to: [email],
        subject: "Your OTP Code",
        html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
      });

      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      next(error); // Pass error to global error handler
    }
  }
  static async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Received request body:", req.body); // Debugging Log

      const { otp } = req.body;

      if (!otp) {
        console.log("OTP is missing!"); // Debugging Log
        res.status(400).json({ message: "OTP is required." });
        return;
      }

      // Find OTP in database
      const storedOtp = await User.findOne({ otp });

      if (
        !storedOtp ||
        !storedOtp.otpExpiresAt ||
        new Date() > new Date(storedOtp.otpExpiresAt)
      ) {
        res.status(400).json({ message: "Invalid or expired OTP." });
        return;
      }

      // Find user by email associated with this OTP
      let user = await User.findOne({ email: storedOtp.email });

      if (!user) {
        user = new User({ email: storedOtp.email, password: "" });
        await user.save();
      }

      res
        .status(200)
        .json({ message: "OTP verified successfully", email: storedOtp.email }); // ✅ Return email
    } catch (error) {
      console.error("Error verifying OTP:", error);
      next(error);
    }
  }

  static async sendOtpLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await User.findOneAndUpdate(
        { email },
        { reset_password_otp: otp, reset_password_otp_time: otpExpiry }, // Updated property
        { new: true, upsert: true } // Ensures the user record is updated or created if not found
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // console.log("OTP: ", otp)

      await NodeMailer.sendMail({
        to: [email],
        subject: "Your Password Reset OTP",
        html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
      });

      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      next(error);
    }
  }

  static async verifyOtpLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ message: "Email and OTP are required" });
        return;
      }

      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (
        !user.reset_password_otp || // Check OTP from reset_password_otp field
        user.reset_password_otp !== otp ||
        !user.reset_password_otp_time ||
        user.reset_password_otp_time < new Date()
      ) {
        res.status(400).json({ message: "Invalid or expired OTP" });
        return;
      }

      // Ensure JWT secret is properly set
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }

      // Generate JWT token
      const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ message: "OTP verified successfully", token });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<any> {
    try {
      const { email, new_password } = req.body;
      if (!email || !new_password) {
        return res
          .status(400)
          .json({ message: "Email and new password are required" });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashPassword = await Utils.encryptPassword(new_password);

      // :x: Do NOT hash again, just assign newPassword
      user.password = hashPassword; // Pre-save hook will hash it
      await user.save();
      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", error });
    }
  }
}
