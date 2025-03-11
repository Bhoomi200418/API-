import { Jwt } from "./../utils/Jwt";
import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import User from "../models/User"; 
import Note from "../models/Note";
import { TokenBlacklist } from "../models/TokenBlacklist";

export class GlobalMiddleWare {
  static checkError(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new Error(errors.array()[0].msg));
    }
    next();
  }

  static async logout(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ message: "Token is required for logout" });
    }

    // Add token to the blacklist
    await TokenBlacklist.create({ token });

    return res.status(200).json({ message: "Logged out successfully" });
  }

  static async auth(req: Request, res: Response, next: NextFunction) {
    const header_auth = req.headers.authorization;
    const token = header_auth ? header_auth.split(" ")[1] : null;

    console.log("Received Token:", token); // Log the received token

    try {
        if (!token) {
            return next(new Error("Unauthorized: No token provided"));
        }

        // Include email in the decoded payload
        const decoded = await Jwt.jwtVerify(token) as { _id?: string; email?: string };

        console.log("Decoded Token:", decoded); // Log the decoded token

        if (!decoded._id || !decoded.email) {
            return next(new Error("Unauthorized: Invalid token"));
        }

        // Store both _id and email in the request object
        (req as any).user = { _id: decoded._id, email: decoded.email };
        next();
    } catch (e) {
        console.error("Token Verification Error:", e); // Log the error
        return next(new Error("Unauthorized: Invalid token"));
    }
}
}