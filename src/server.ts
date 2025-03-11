import express, { Application, Request, Response, NextFunction } from "express";
import * as mongoose from "mongoose";
import { getEnvironmentVariable } from "./environments/environment";
import UserRouter from "./routers/UserRouter";
import NotesRouter from "./routers/NotesRouter";  // Import Notes Router
import * as bodyParser from "body-parser";
import cors from "cors";  
import { Utils } from "./utils/Utils";
// import NotesRouter from "./routers/NotesRouter";
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
    mongoose.connect(getEnvironmentVariable().db_uri)
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("MongoDB Connection Error:", err));
  }

  private configureBodyParser(): void {
    this.app.use(express.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  private allowCors(): void {
    this.app.use(cors());
  }

  private setRoutes(): void {
    this.app.use("/api/user", UserRouter);
    this.app.use("/api/notes", NotesRouter);  
    // this.app.use('/api/user', otpRoutes);
  }

  private error404Handler(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        message: "Not found",
        status_code: 404,
      });
    });
  }

  private handleErrors(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error("Error:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    });
  }
}
