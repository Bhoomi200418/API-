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
  ): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password || !phone) {
        res.status(400).json({
          message: "All fields (name, email, password, phone) are required",
        });
        return;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ message: "Email already exists" });
        return;
      }

      const verificationToken = Utils.generateVerificationToken();
      const hash = await Utils.encryptPassword(password);

      const newUser = new User({ name, email, password: hash, phone });
      await newUser.save();

      const payload = { email: newUser.email };
      const token = Jwt.jwtSign(payload, newUser._id);

      res
        .status(201)
        .json({ message: "Signup successful", token, user: newUser });

      await NodeMailer.sendMail({
        to: [newUser.email],
        subject: "Email Verification",
        html: `<h1>Your OTP is ${verificationToken}</h1>`,
      });
    } catch (error) {
      console.error("Signup Error:", error);
      next(error);
    }
  }
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // Ensure return type is void
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return; // ✅ Ensures function returns void
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return; // ✅ Ensures function returns void
      }

      const payload = { email: user.email };
      const token = Jwt.jwtSign(payload, user._id);

      res
        .status(200)
        .json({
          message: "Login successful",
          token,
          email: user.email,
          userId: user._id,
        });
      return; // ✅ Ensures function returns void
    } catch (error) {
      next(error);
      return; // ✅ Ensures function returns void
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

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

      // Find user and update OTP
      const user = await User.findOneAndUpdate(
        { email },
        { otp, otpExpiresAt: otpExpiry },
        { new: true, upsert: true }
      );

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
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      // Validate input
      if (!email || !otp) {
        res.status(400).json({ message: "Email and OTP are required" });
        return;
      }

      // Find user by emailF
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Check if OTP matches and is still valid
      if (
        !user.otp ||
        user.otp !== otp ||
        !user.otpExpiresAt ||
        user.otpExpiresAt < new Date()
      ) {
        res.status(400).json({ message: "Invalid or expired OTP" });
        return;
      }

      // Clear OTP after successful verification
      await User.updateOne({ email }, { $unset: { otp: 1, otpExpiresAt: 1 } });

      res
        .status(200)
        .json({ message: "OTP verified successfully", email: email });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      next(error); // Pass error to global error handler
    }
  }
}
