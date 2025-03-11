import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { UserController } from "../controllers/UserController";


// Load environment variables from .env file
dotenv.config();

export class NodeMailer {
  private static initiateTransport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }

  static async sendMail(data: { to: string[]; subject: string; html: string }): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@example.com",
      to: data.to.join(", "), // Join array of recipients into a single string
      subject: data.subject,
      html: data.html,
    };

    try {
      const transport = NodeMailer.initiateTransport();
      await transport.sendMail(mailOptions);
      console.log(` Email sent successfully to: ${data.to.join(", ")}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email. Please try again later.");
    }
  }
}
