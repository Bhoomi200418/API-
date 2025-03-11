import { body } from "express-validator";
import User from "../models/User"; 

export class UserValidators {
  static signup() {
    return [
      
      body("email", "Valid Email is required")
        .isEmail()
        .custom(async (email) => {
          const user = await User.findOne({ email });
          if (user) {
            return Promise.reject("User already exists");
          }
          return true;
        }),
      body("password", "Password must be 8-25 characters long")
        .isAlphanumeric()
        .isLength({ min: 8, max: 25 }),
     
    ];
  }

  static login() {
    return [
      body("email", "Valid email is required")
        .isEmail()
        .custom(async (email, { req }) => {
          const user = await User.findOne({ email });
          if (!user) {
            return Promise.reject("No user registered with this email");
          }
          req.user = user;
          return true;
        }),
      body("password", "Password is required").isAlphanumeric(),
    ];
  }

  static createNote() {
    return [
      body("title", "Title is required").isString(),
      body("content", "Content is required").isString(),
    ];
  }

  static updateNote() {
    return [
      body("noteId", "Note ID is required").isMongoId(),
      body("title", "Title is required").optional().isString(),
      body("content", "Content is required").optional().isString(),
    ];
  }

  static deleteNote() {
    return [
      body("noteId", "Note ID is required").isMongoId(),
    ];
  }

  static checkResetPasswordEmail() {
    return [
      body("email", "Valid email is required")
        .isEmail()
        .custom(async (email) => {
          const user = await User.findOne({ email });
          if (!user) {
            return Promise.reject("No user registered with this email");
          }
          return true;
        }),
    ];
  }

  static verifyResetPasswordToken() {
    return [
      body("email", "Valid email is required").isEmail(),
      body("reset_password_token", "Reset password token is required")
        .isNumeric()
        .custom(async (token, { req }) => {
          const user = await User.findOne({
            email: req.body.email,
            reset_password_token: token,
            reset_password_token_time: { $gt: Date.now() },
          });

          if (!user) {
            return Promise.reject(
              "Reset password token is invalid or expired. Please regenerate."
            );
          }
          return true;
        }),
    ];
  }

  static resetPassword() {
    return [
      body("email", "Valid email is required")
        .isEmail()
        .custom(async (email, { req }) => {
          const user = await User.findOne({ email });
          if (!user) {
            return Promise.reject("No user registered with this email");
          }
          req.user = user;
          return true;
        }),
      body("new_password", "New password is required").isAlphanumeric(),
      body("otp", "Reset password token is required")
        .isNumeric()
        .custom((otp, { req }) => {
          if (req.user.reset_password_token !== otp) {
            req.errorStatus = 422;
            return Promise.reject("Reset password token is invalid. Try again.");
          }
          return true;
        }),
    ];
  }

 

  static verifyUserProfile() {
    return [
      body("phone", "Phone number is required").isString(),
      body("email", "Valid email is required")
        .isEmail()
        .custom(async (email, { req }) => {
          if (req.user.email === email) {
            return Promise.reject(
              "Please provide a new unique email address to update the user profile."
            );
          }
          const user = await User.findOne({ email });
          if (user) {
            return Promise.reject(
              "A user with this email already exists. Please use a unique email ID."
            );
          }
          return true;
        }),
      body("password", "Password is required").isAlphanumeric(),
    ];
  }

  static sendOtp() {
    return [
      body("email", "Valid email is required").isEmail(),
    ];
  }


  static verifyOtp() {
    return [
      body("email", "Valid email is required").isEmail(),
      body("otp", "OTP must be a 6-digit number")
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .custom(async (otp, { req }) => {
          const user = await User.findOne({ email: req.body.email });

          if (!user) {
            return Promise.reject("User not found.");
          }

          if (user.otp !== otp) {
            return Promise.reject("Invalid OTP. Please try again.");
          }

          if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            return Promise.reject("OTP has expired. Request a new one.");
          }

          return true;
        }),
    ];
  }
}


