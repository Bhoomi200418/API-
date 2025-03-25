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

      const user = await User.findOne({email});
      if(!user) {
        return res.status(404).json({ message: "User not found" });
      }
   
      const hash = await Utils.encryptPassword(password);
      user.password = hash;
      await user.save();
  
      const payload = { email: user.email };
      const token = Jwt.jwtSign(payload, user._id);
  
      return res.status(201).json({
        message: "Signup successful",
        token,
        user: user,
      });
  
    } catch (error) {
      console.error("Signup Error:", error);
      next(error);  // ✅ Pass error to Express error handler
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

      console.log("User : ", user)

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

      // Find user by email
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



  static async sendOtpLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        { otp, otpExpiresAt: otpExpiry },
        { new: true }
      );
  
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      await NodeMailer.sendMail({
        to: [email],
        subject: "Your OTP Code",
        html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
      });
  
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      next(error);
    }
  }
  
  
  
  static async verifyOtpLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    if (!user.otp || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Clear OTP after successful verification
    await User.updateOne({ email }, { $unset: { otp: 1, otpExpiresAt: 1 } });

    // Generate JWT token
    const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    next(error);
  }
}

static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ message: "Email and new password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    next(error);
  }
}
}
