// import jwt, { SignOptions, VerifyErrors } from "jsonwebtoken";
// import { getEnvironmentVariable } from "../environments/environment";

// export class Jwt {
//   static async jwtSign(payload: object): Promise<string> {
//       return jwt.sign(payload, getEnvironmentVariable().jwt_secret_key, { expiresIn: '1h' });
//   }

//   static async jwtVerify(token: string): Promise<any> {
//     return jwt.verify(token, getEnvironmentVariable().jwt_secret_key);
// }
// }
// export class Jwt {
//   static jwtSign(
//     payload: object | string | Buffer,
//     expires_in: string = "180d"
//   ): string {
//     return jwt.sign(payload, getEnvironmentVariable().jwt_secret_key as string,
//      {
//       expiresIn: expires_in,
//       issuer: "bhoomi.com",
//      } as SignOptions);
//   }

// static jwtVerify(token: string): Promise<object | string> {
//   return new Promise((resolve, reject) => {
//     jwt.verify(
//       token,
//       getEnvironmentVariable().jwt_secret_key as string,
//       (err: VerifyErrors | null, decoded: object | string | undefined) => {
//         if (err) return reject(err);
//         if (!decoded) return reject(new Error("User is not authorized."));
//         resolve(decoded);
//       }
//     );
//   });
// }

import * as jwt from "jsonwebtoken";

export class Jwt {
  static jwtSign(payload: any, userId: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
      audience: userId.toString()
    });
  }

  static jwtVerify(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        process.env.JWT_SECRET as string,
        (err, decoded) => {
          if (err) reject(err);
          else if (!decoded) reject(new Error("User is not authorised."));
          else resolve(decoded);
        }
      );
    });
  }
}
