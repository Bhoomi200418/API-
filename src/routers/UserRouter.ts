import { Router } from "express";
import { UserValidators } from "../validators/UserValidators";
import { UserController } from "../controllers/UserController";
import { GlobalMiddleWare } from "../middleware/GlobalMiddleWare";

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
    this.router.get("/notes/date", GlobalMiddleWare.auth, UserController.getNotesByDate);
    this.router.get("/profile", GlobalMiddleWare.auth, UserController.userProfile);
  }

  private postRoutes() {
    this.router.post(
      "/signup",
      UserValidators.signup(),
      GlobalMiddleWare.checkError,
      UserController.signup
    );
    
    this.router.post(
      "/login",
      UserValidators.login(),
      GlobalMiddleWare.checkError,
      UserController.login
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

    // ✅ Fixed logout by using `UserController.logout`
    this.router.post("/logout", GlobalMiddleWare.auth, UserController.logout);

    this.router.post("/notes", GlobalMiddleWare.auth, UserController.createNote);
  }

  private patchRoutes() {
    this.router.patch("/notes/:noteId", GlobalMiddleWare.auth, UserController.updateNote);
  }

  private deleteRoutes() {
    this.router.delete("/notes/:noteId", GlobalMiddleWare.auth, UserController.deleteNote);
  }
}

export default new UserRouter().router;
