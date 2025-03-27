import * as jwt from "jsonwebtoken";

export class Jwt {
  // Generic JWT signing method
  static sign(payload: object, p0: string, p1: { expiresIn: string; }, options?: jwt.SignOptions): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET, { ...options, expiresIn: "10h" });
  }

  // JWT Sign with userId
  static jwtSign(payload: object, userId: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(
      { ...payload, sub: userId }, // Changed `aud` to `sub` for consistency
      process.env.JWT_SECRET,
      {
        expiresIn: "10h",
        issuer: "bhoomi.com"
      }
    );
  }

  // JWT Verify Method
  static jwtVerify(token: string): Promise<object | string> {
    return new Promise((resolve, reject) => {
      if (!process.env.JWT_SECRET) {
        return reject(new Error("JWT_SECRET is not defined in environment variables"));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error("JWT Verification Failed:", err);
          return reject(new Error("Invalid or expired token"));
        }
        if (!decoded) {
          return reject(new Error("Unauthorized: No valid token found"));
        }
        resolve(decoded);
      });
    });
  }
}
