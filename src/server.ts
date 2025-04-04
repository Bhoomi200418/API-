import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getEnvironmentVariable } from "./environments/environment";
import userRouter from "./routers/UserRouter";
import notesRouter from "./routers/NotesRouter";
import bodyParser from "body-parser";
import { GlobalMiddleWare } from "./middleware/GlobalMiddleWare";

import cors from "cors";
import { Utils } from "./utils/Utils";
import BlacklistedToken from "./models/BlacklistedToken";

export class Server {
  public app: Application = express();

  constructor() {
    this.dotenvConfigs();
    this.setConfigs();
    this.setRoutes();
    this.error404Handler();
    this.handleErrors();
  }

  private dotenvConfigs(): void {
    Utils.dotenvConfigs();
  }

  private setConfigs(): void {
    this.connectMongoDB();
    this.allowCors();
    this.configureBodyParser();
  }

  private connectMongoDB(): void {
    const dbURI = getEnvironmentVariable().db_uri;
    if (!dbURI) {
      console.error("Error: Missing MongoDB URI. Check environment variables.");
      process.exit(1); // Exit if DB URI is missing
    }

    mongoose
      .connect(dbURI)
      .then(() => console.log("✅ Connected to MongoDB"))
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit on failure
      });
  }

  private configureBodyParser(): void {
    this.app.use(express.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  private allowCors(): void {
    this.app.use(
      cors({
        origin: "*", // Change this to specific frontend URL in production
        methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
        allowedHeaders: "Content-Type,Authorization",
        credentials: true, // Allow credentials if needed (e.g., cookies, auth headers)
      })
    );

    this.app.options("*", cors()); // Handle preflight requests
  }

  private setRoutes(): void {
    // Apply middleware before defining routes
    this.app.use((req, res, next) => GlobalMiddleWare.checkTokenBlacklist(req, res, next));

    // Define routes
    this.app.use("/api/user", userRouter);
    this.app.use("/api/note", notesRouter);
  }

  private error404Handler(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ message: "Not found", status_code: 404 });
    });
  }

  private handleErrors(): void {
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
    );
  }
}
