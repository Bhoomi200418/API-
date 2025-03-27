import { body } from "express-validator";
import User from "../models/User";

export class UserValidators {
  static signup() {
    return [
      body("email")
        .isEmail()
        .withMessage("Valid Email is required")
        .custom(async (email) => {
          console.log("Checking user existence for email:", email);
          const user = await User.findOne({ email });
          console.log("Database result:", user);
        }),

      body("password", "Password must be 6-25 characters long and alphanumeric")
        .isAlphanumeric()
        .isLength({ min: 6, max: 25 }),

      body("confirmPassword", "Passwords do not match").custom(
        (confirmPassword, { req }) => {
          if (confirmPassword !== req.body.password) {
            throw new Error("Passwords do not match");
          }
          return true;
        }
      ),
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
    return [body("noteId", "Note ID is required").isMongoId()];
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
      body("otp", "Reset password token is required").isString(),
    ];
  }

  static sendOtpLogin() {
    return [body("email").isEmail().withMessage("Invalid email format")];
  }

  static verifyOtpLogin() {
    return [
      body("email").isEmail().withMessage("Invalid email format"),
      body("otp")
        .isNumeric()
        .withMessage("OTP must be numeric")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits"),
    ];
  }

  static resetPassword() {
    return [
      body("email", "Email is required")
        .isEmail()
        .custom(async (email, { req }) => {
          const user = await User.findOne({ email });
          if (!user) {
            throw new Error("No User Registered with such Email");
          }
          req.user = user;
          return true;
        }),
      body("new_password", "New password is required").isAlphanumeric(),
      body("otp", "Reset password token is required")
        .isString()
        .custom((otp, { req }) => {
          if (req.user.reset_password_otp !== otp) {
            throw new Error(
              "Reset password token is invalid, please try again"
            );
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
    return [body("email", "Valid email is required").isEmail()];
  }

  static verifyOtp() {
    return [
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
