import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Note from "../models/Note";

import { NodeMailer } from "../utils/NodeMailer";
import BlacklistedToken from "../models/BlacklistedToken";

import { Utils } from "../utils/Utils";

import { Jwt } from "../utils/Jwt";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

      const payload = { aud: newUser._id, email: newUser.email };
      const token = Jwt.jwtSign(payload);

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
  ): Promise<void> { // Ensure return type is void
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
  
      const token = Jwt.jwtSign({ id: user._id, email: user.email });
  
      res.status(200).json({ message: "Login successful", token, email: user.email });
      return; // ✅ Ensures function returns void
    } catch (error) {
      next(error);
      return; // ✅ Ensures function returns void
    }
  }
  
  static async getNotes(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user._id) {
        return res
          .status(401)
          .json({ message: "Unauthorized: User not found" });
      }

      const notes = await Note.find({ userId: user._id });

      // ✅ Print Retrieved Notes
      console.log("📜 Retrieved Notes:", notes);

      res.status(200).json({ message: "Notes fetched successfully", notes });
    } catch (error) {
      console.error("Get Notes Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Fetch notes by date
  static async getNotesByDate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { date } = req.query;
      if (!date) {
        res.status(400).json({ message: "Date is required" });
        return;
      }

      const notes = await Note.find({
        userId: req.user._id,
        createdAt: { $gte: new Date(date as string) },
      });
      res.json({ notes });
    } catch (error) {
      console.error("Get Notes by Date Error:", error);
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
  static async createNote(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user || !user._id) {
        res.status(401).json({ message: "Unauthorized: User not found" });
        return;
      }

      const { title, content } = req.body;
      if (!title || !content) {
        res.status(400).json({ message: "Title and content are required" });
        return;
      }

      const newNote = new Note({
        title,
        content,
        userId: user._id,
      });

      await newNote.save();
      console.log("📝 New Note Created:", newNote);

      res
        .status(201)
        .json({ message: "Note created successfully", note: newNote });
    } catch (error) {
      console.error("Create Note Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Update a note
  static async updateNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { noteId, title, content } = req.body;
      if (!noteId) {
        res.status(400).json({ message: "Note ID is required" });
        return;
      }

      const updatedNote = await Note.findOneAndUpdate(
        { _id: noteId, userId: req.user._id },
        { title, content },
        { new: true }
      );

      if (!updatedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.json({ message: "Note updated successfully", note: updatedNote });
    } catch (error) {
      console.error("Update Note Error:", error);
      next(error);
    }
  }

  // Delete a note
  static async deleteNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { noteId } = req.body;
      if (!noteId) {
        res.status(400).json({ message: "Note ID is required" });
        return;
      }

      const deletedNote = await Note.findOneAndDelete({
        _id: noteId,
        userId: req.user._id,
      });

      if (!deletedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Delete Note Error:", error);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      
      if (!token) {
        res.status(400).json({ message: "Bad Request - No token provided" });
        return;
      }
  
      // Check if the token is already blacklisted
      const existingBlacklistedToken = await BlacklistedToken.findOne({ token });
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

  // static  async logout = (req: Request, res: Response) => {
  //   return res
  //     .status(200)
  //     .json({
  //       message: "Logged out successfully. Remove token on client side.",
  //     });
  // };

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
}
