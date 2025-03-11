import jwt, { SignOptions, VerifyErrors } from "jsonwebtoken";
import { getEnvironmentVariable } from "../environments/environment";

export class Jwt {
  static jwtSign(payload: object | string | Buffer, expires_in: string = "180d"): string {
    return jwt.sign(
      payload,
      getEnvironmentVariable().jwt_secret_key as string, // Ensure it's a string
      { expiresIn: expires_in, issuer: "bhoomi.com" } as SignOptions
    );
  }

  static jwtVerify(token: string): Promise<object | string> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getEnvironmentVariable().jwt_secret_key as string, 
        (err: VerifyErrors | null, decoded: object | string | undefined) => {
          if (err) return reject(err);
          if (!decoded) return reject(new Error("User is not authorized."));
          console.log("Decoded Token:", decoded); // ✅ Added for debugging
          resolve(decoded);
        }
      );
    });
  }
}