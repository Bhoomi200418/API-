import { DevEnvironment } from "./environment.dev";
import { ProdEnvironment } from "./environment.prod";

export interface Environment {
    db_uri: string,
      jwt_secret_key: string
}

export function getEnvironmentVariable() {
    if (process.env.NODE_ENV == 'production') {
        return ProdEnvironment;
    }
    return DevEnvironment;
}