import * as jwt from "jsonwebtoken";

export class Jwt {
  static sign(arg0: { id: unknown; }, arg1: string, arg2: { expiresIn: string; }) {
    throw new Error("Method not implemented.");
  }
  static jwtSign(payload: object, userId: any): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10h",
      audience: userId.toString(),
      issuer: "bhoomi.com"
    });
  }

  static jwtVerify(token: string): Promise<object | string> {
    return new Promise((resolve, reject) => {
      if (!process.env.JWT_SECRET) {
        return reject(new Error("JWT_SECRET is not defined in environment variables"));
      }
      
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else if (!decoded) reject(new Error("User is not authorized."));
        else resolve(decoded);
      });
    });
  }
}
