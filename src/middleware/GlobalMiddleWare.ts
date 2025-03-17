import { Jwt } from "./../utils/Jwt";
import { validationResult } from "express-validator";
import express, { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Note from "../models/Note";
import BlacklistedToken from "../models/BlacklistedToken";
import jwt from "jsonwebtoken";
import userRouter from "../routers/UserRouter"; // ✅ Added missing import

export class GlobalMiddleWare {
  static checkError(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new Error(errors.array()[0].msg));
    }
    next();
  }
  static async auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.split(" ")[1];
  
      if (!token) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return; // ✅ Fix: Explicit return
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as any).user = decoded;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ message: "Session expired. Please log in again." });
      } else {
        res.status(401).json({ message: "Unauthorized: Token verification failed" });
      }
      return; // ✅ Fix: Explicit return to match void type
    }
  }
  

  static async checkTokenBlacklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const blacklisted = await BlacklistedToken.findOne({ token });
            if (blacklisted) {
                res.status(401).json({ message: "Token has been blacklisted. Please log in again." });
                return;
            }
        }
        next(); // ✅ Call next() properly
    } catch (error) {
        console.error("Error checking token blacklist:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//   private setRoutes(): void {
//     const router = express.Router();
    
//     router.use((req, res, next) => GlobalMiddleWare.checkTokenBlacklist(req, res, next));

//     router.use("/users", userRouter); // No "/api" here, since it's handled by `app.use()`

    

// }
}