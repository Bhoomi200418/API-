import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedToken";

export interface AuthRequest extends Request {
  user?: JwtPayload & { sub?: string }; // Ensure `sub` (user ID) exists
}

export class GlobalMiddleWare {
  static checkError(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return; // Stop execution after sending response
    }
    next();
  }

  static async auth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Authorization Header:", req.headers.authorization); // 🔍 Log header

      const header_auth = req.headers.authorization;
      if (!header_auth || !header_auth.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return;
      }

      const token = header_auth.slice(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload & { sub?: string };

      console.log("Decoded Token:", decoded); // 🔍 Debugging log
      req.user = decoded; // Attach user to request

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  }

  static async checkTokenBlacklist(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
          res.status(401).json({
            message: "Token has been blacklisted. Please log in again.",
          });
          return; // Ensure function exits after sending response
        }
      }
      next(); // Call next middleware
    } catch (error) {
      next(error); // Pass error to Express error handler
    }
  }
}
