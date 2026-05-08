import { domainName, hostUrl } from "@common/functions";
import nodemailer from "nodemailer";
import {
  accountCreatedEmailTemplate,
  passwordAdminResetEmailTemplate,
  passwordResetRequestEmailTemplate,
  testEmailTemplate,
} from "./emailTemplates";

export enum TplIds {
  AccountCreated = "account-created",
  PasswordAdminReset = "password-admin-reset",
  PasswordResetRequest = "password-reset-request",
  Test = "test",
}

export enum EmailSubject {
  Test = "Test mail",
  PasswordResetRequest = "Password reset request",
  PasswordReset = "Password reset",
  AccountCreated = "Account created",
}

interface DynamicTplRequest {
  id: TplIds;
  data: any;
  subject: EmailSubject;
}

function buildHtml(tpl: DynamicTplRequest): string {
  const d = tpl.data;
  switch (tpl.id) {
    case TplIds.AccountCreated:
      return accountCreatedEmailTemplate(d.email, d.domain, d.link);
    case TplIds.PasswordResetRequest:
      return passwordResetRequestEmailTemplate(d.email, d.domain, d.link);
    case TplIds.PasswordAdminReset:
      return passwordAdminResetEmailTemplate(d.username, d.rawPassword, d.domain);
    case TplIds.Test:
      return testEmailTemplate(d.domain);
    default:
      return "";
  }
}

export function accountCreatedTemplate(
  email: string,
  link: string
): DynamicTplRequest {
  return {
    id: TplIds.AccountCreated,
    data: {
      email,
      domain: domainName(),
      link: `${hostUrl()}${link}`,
    },
    subject: EmailSubject.AccountCreated,
  };
}

export function passwordResetRequestTemplate(
  email: string,
  link: string
): DynamicTplRequest {
  return {
    id: TplIds.PasswordResetRequest,
    data: {
      email,
      link: `${hostUrl()}${link}`,
      domain: domainName(),
    },
    subject: EmailSubject.PasswordReset,
  };
}

export function passwordAdminResetTemplate(
  username: string,
  rawPassword: string
): DynamicTplRequest {
  return {
    id: TplIds.PasswordAdminReset,
    data: {
      username,
      rawPassword,
      domain: domainName(),
    },
    subject: EmailSubject.PasswordReset,
  };
}

export function testTemplate(): DynamicTplRequest {
  return {
    id: TplIds.Test,
    data: {
      domain: domainName(),
    },
    subject: EmailSubject.Test,
  };
}

class Mailer {
  lastEmailSubject?: string;
  lastEmailData?: any;
  devMode = true;
  private transporter?: nodemailer.Transporter;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_SECRET;
    const from = process.env.MAILER_SENDER;
    const host = process.env.SMTP_HOST;
    if (user && pass && from && host) {
      this.devMode = false;
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    console.log(`[Mailer]: prepared${this.devMode ? " (dev mode)" : ""}`);
  }

  async sendTemplate(recipient: string, tpl: DynamicTplRequest): Promise<void> {
    if (this.devMode) {
      console.log(`[Mailer] dev sendTemplate: ${tpl.subject} -> ${recipient}`);
      console.log("Data: ", JSON.stringify(tpl.data, null, 4));

      this.lastEmailSubject = tpl.subject;
      this.lastEmailData = tpl.data;
      return;
    }

    if (!this.transporter) {
      throw new Error("Mailer transporter not configured");
    }

    try {
      const wat = await this.transporter.sendMail({
        from: process.env.MAILER_SENDER || "",
        to: recipient,
        subject: tpl.subject,
        html: buildHtml(tpl),
      });
    } catch (e) {
      throw new Error(`Email error for template ${tpl.subject}: ${e}`);
    }
  }
}

const mailer: Mailer = new Mailer();
export default mailer;
