import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer, { FileFilterCallback } from "multer";
import BlacklistedToken from "../models/BlacklistedToken";

import { Request } from "express";

dotenv.config(); // Ensure environment variables are loaded at the start

// Multer Storage Configuration
const storageOptions = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cd: (error: Error | null, destination: string) => void
  ) => {
    console.log(file);
    cd(null, `./src/uploads/${file.fieldname}`);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cd: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cd(null, uniqueSuffix + file.originalname);
  },
});

// ✅ Corrected file filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cd: FileFilterCallback
) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cd(null, true);
  } else {
    cd(null, false);
  }
};

export class Utils {
  static jwtSign(payload: { user_id: string; email: string }) {
    const secretKey = process.env.JWT_SECRET || "default_secret";
    return jwt.sign(payload, secretKey, { expiresIn: "1h" });
  }

  static dotenvConfigs(): void {
    dotenv.config();
    console.log("Environment variables loaded successfully.");
  }

  public MAX_TOKEN_TIME = 5 * 60 * 1000;

  public multer = multer({ storage: storageOptions, fileFilter });

  static generateVerificationToken(digit: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < digit; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  static encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static comparePassword(data: {
    password: string;
    encrypt_password: string;
  }): Promise<boolean> {
    return bcrypt.compare(data.password, data.encrypt_password);
  }}
  export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;
  console.log("Checking token:", token); // :white_tick: Debugging line
  const blacklisted = await BlacklistedToken.findOne({ token }).lean();
  console.log("Blacklisted result:", blacklisted); // :white_tick: Debugging line
  return !!blacklisted;
};

