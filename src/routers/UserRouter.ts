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
      UserController.verifyOTP
    );

    this.router.post(
      "/send-otp-login",
      UserValidators.sendOtpLogin(),
      GlobalMiddleWare.checkError,
      UserController.sendOtpLogin
    );

    this.router.post(
      "/verify-otp-login",
      UserValidators.verifyOtpLogin(),
      GlobalMiddleWare.checkError,
      UserController.verifyOtpLogin
    );

    this.router.post(
      "/reset-password",
      UserValidators.resetPassword(),
      GlobalMiddleWare.checkError,
      UserController.resetPassword
    );



    // ✅ Fixed logout by using `UserController.logout`
    this.router.post("/logout", GlobalMiddleWare.auth, UserController.logout);

   
  }

  private patchRoutes() {
   
  }

  private deleteRoutes() {
   
  }
}

export default new UserRouter().router;