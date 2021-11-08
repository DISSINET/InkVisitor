import * as nodemailer from "nodemailer";
import Email from "email-templates";
import nodemailerSendgrid from "nodemailer-sendgrid";
const path = require("path");

export enum EmailTpl {
  Test = "test",
  PasswordReset = "password_reset",
  AccountCreated = "new_user",
}

export enum EmailSubject {
  Test = "Test mail",
  PasswordReset = "Password reset",
  AccountCreated = "Account created",
}

class Mailer {
  nodeTransporter: nodemailer.Transporter;

  constructor() {
    if (!process.env.NODEMAILER_API_KEY) {
      throw new Error("NODEMAILER_API_KEY variable is required");
    }

    if (!process.env.MAILER_SENDER) {
      throw new Error("MAILER_SENDER variable is required");
    }

    this.nodeTransporter = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.NODEMAILER_API_KEY,
      })
    );

    console.log("[Mailer]: prepared");
  }

  sendTest(recipient: string, subject: EmailSubject, tpl: EmailTpl, data: any) {
    const email = new Email({
      message: {
        from: "johnny.mert@gmail.com",
      },
      send: process.env.NODE_ENV === "production",
      transport: this.nodeTransporter,
    });

    email
      .send({
        template: path.join(__dirname, "emails", tpl),
        message: {
          to: recipient,
          subject: subject,
        },
        locals: data,
      })
      .catch((e) => console.log("[Mailer.test]: ", e));
  }

  sendPasswordReset(recipient: string, data: any) {
    const email = new Email({
      message: {
        from: process.env.MAILER_SENDER,
      },
      send: process.env.NODE_ENV === "production",
      transport: this.nodeTransporter,
    });

    console.log(
      process.env.MAILER_SENDER,
      recipient,
      EmailSubject.PasswordReset,
      data
    );

    email
      .send({
        template: path.join(__dirname, "emails", EmailTpl.PasswordReset),
        message: {
          to: recipient,
          subject: EmailSubject.PasswordReset,
        },
        locals: data,
      })
      .catch((e) =>
        console.log("[Mailer.sendPasswordReset]: ", JSON.stringify(e))
      );
  }

  sendNewUser(recipient: string, data: any) {
    const email = new Email({
      message: {
        from: process.env.MAILER_SENDER,
      },
      send: process.env.NODE_ENV === "production",
      transport: this.nodeTransporter,
    });

    email
      .send({
        template: path.join(__dirname, "emails", EmailTpl.AccountCreated),
        message: {
          to: recipient,
          subject: EmailSubject.AccountCreated,
        },
        locals: data,
      })
      .catch((e) => console.log("[Mailer.sendNewUser]: ", JSON.stringify(e)));
  }
}

const mailer: Mailer = new Mailer();
export default mailer;
