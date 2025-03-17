import { DevEnvironment } from "./environment.dev";
import { ProdEnvironment } from "./environment.prod";

export interface Environment {
    db_uri: string,
      jwt_secret_key: string
}
export function getEnvironmentVariable() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is undefined. Please check your .env file.");
    }

    return {
        db_uri: process.env.DB_URI || "",
        jwt_secret_key: jwtSecret
    };
}