import * as nodemailer from "nodemailer";
import Email from "email-templates";
import nodemailerSendgrid from "nodemailer-sendgrid";
const path = require("path");

// codenames for template-file names
export enum EmailTpl {
  Test = "test",
  PasswordReset = "password_reset",
  AccountCreated = "new_user",
}

// codenames for email subjects
export enum EmailSubject {
  Test = "Test mail",
  PasswordReset = "Password reset",
  AccountCreated = "Account created",
}

class Mailer {
  nodeTransporter: nodemailer.Transporter;
  devMode: boolean = true;

  constructor() {
    if (process.env.NODEMAILER_API_KEY && process.env.MAILER_SENDER) {
      this.devMode = false;
    }

    this.nodeTransporter = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.NODEMAILER_API_KEY || "",
      })
    );

    console.log(`[Mailer]: prepared${this.devMode ? " (dev mode)" : ""}`);
  }

  /**
   * sends test template to chosen address
   * @param recipient
   * @param data
   * @returns
   */
  sendTest(recipient: string, data: any): Promise<any> {
    const email = new Email({
      message: {
        from: process.env.MAILER_SENDER,
      },
      send: !this.devMode,
      preview: this.devMode,
      transport: this.nodeTransporter,
    });

    return email.send({
      template: path.join(__dirname, "emails", EmailTpl.Test),
      message: {
        to: recipient,
        subject: EmailSubject.Test,
      },
      locals: data,
    });
  }

  /**
   * sends password reset template
   * @param recipient
   * @param data
   * @returns
   */
  sendPasswordReset(recipient: string, data: any): Promise<any> {
    const email = new Email({
      message: {
        from: process.env.MAILER_SENDER,
      },
      send: !this.devMode,
      preview: this.devMode,
      transport: this.nodeTransporter,
    });

    return email.send({
      template: path.join(__dirname, "emails", EmailTpl.PasswordReset),
      message: {
        to: recipient,
        subject: EmailSubject.PasswordReset,
      },
      locals: data,
    });
  }

  /**
   * sends new-user template
   * @param recipient
   * @param data
   * @returns
   */
  sendNewUser(recipient: string, data: any): Promise<any> {
    const email = new Email({
      message: {
        from: process.env.MAILER_SENDER,
      },
      send: !this.devMode,
      preview: this.devMode,
      transport: this.nodeTransporter,
    });

    return email.send({
      template: path.join(__dirname, "emails", EmailTpl.AccountCreated),
      message: {
        to: recipient,
        subject: EmailSubject.AccountCreated,
      },
      locals: data,
    });
  }
}

const mailer: Mailer = new Mailer();
export default mailer;
