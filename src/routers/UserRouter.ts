import { Request, Response, Router } from "express";
import { UserValidators } from "../validators/UserValidators";
import { UserController } from "../controllers/UserController";
import { GlobalMiddleWare } from "../middleware/GlobalMiddleWare";
import asyncHandler from "express-async-handler";
import User from "../models/User"; 


class UserRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.getRoutes();
    this.postRoutes();
    this.patchRoutes();
    this.deleteRoutes();
  }

  private getRoutes() {
    this.router.get("/notes", GlobalMiddleWare.auth, UserController.getNotes);
    this.router.get(
      "/notes/date",
      GlobalMiddleWare.auth,
      UserController.getNotesByDate
    );
    this.router.get(
      "/profile",
      GlobalMiddleWare.auth,
      UserController.userProfile
    );
  }

  private postRoutes() {
    this.router.post(
      "/signup",
      UserValidators.signup(),
      GlobalMiddleWare.checkError,
      UserController.signup
    );
    this.router.post(
      "/notes",
      GlobalMiddleWare.auth,
      UserController.createNote
    );
    this.router.post(
      "/login",
      UserValidators.login(),
      GlobalMiddleWare.checkError,
      asyncHandler(UserController.login)
    );
    this.router.post(
      "/send-otp",
      UserValidators.sendOtp(),
      UserController.sendOtp
    );
    this.router.post(
      "/verify-otp",
      UserValidators.verifyOtp(),
      UserController.verifyOtp
    );
    this.router.post("/logout", GlobalMiddleWare.auth, UserController.logout);
  }
  private patchRoutes() {
    this.router.patch(
      "/notes",
      GlobalMiddleWare.auth,
      UserController.updateNote
    );
  }

  private deleteRoutes() {
    this.router.delete(
      "/notes",
      GlobalMiddleWare.auth,
      UserController.deleteNote
    );
  
  }
}

export default new UserRouter().router;
