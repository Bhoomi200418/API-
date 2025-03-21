import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

import BlacklistedToken from "../models/BlacklistedToken";
import jwt from "jsonwebtoken";
import { Jwt } from "../utils/Jwt";

export class GlobalMiddleWare {
  static checkError(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new Error(errors.array()[0].msg));
    }
    next();
  }
  static async auth(req: Request, res: Response, next: NextFunction) {
    const header_auth = req.headers.authorization;
    const token = header_auth ? header_auth.slice(7, header_auth.length) : null;
    try {
      if (!token) {
        (req as any).errorStatus = 401;
        next(new Error("User doesn't exist1"));
      }
      const decoded = await Jwt.jwtVerify(token as string);
      (req as any).user = decoded;
      next();
    } catch (e) {
      (req as any).errorStatus = 401;
      next(new Error("User doesn't exist2"));
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
