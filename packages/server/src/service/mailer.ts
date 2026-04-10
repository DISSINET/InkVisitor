import { domainName, hostUrl } from "@common/functions";
import nodemailer from "nodemailer";

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(tpl: DynamicTplRequest): string {
  const d = tpl.data;
  switch (tpl.id) {
    case TplIds.AccountCreated:
      return `<p>Hello,</p><p>Your account was created for <strong>${escapeHtml(
        d.email
      )}</strong> on ${escapeHtml(d.domain)}.</p><p><a href="${escapeHtml(
        d.link
      )}">Activate your account</a></p>`;
    case TplIds.PasswordResetRequest:
      return `<p>Hello,</p><p>Password reset was requested for ${escapeHtml(
        d.email
      )} on ${escapeHtml(d.domain)}.</p><p><a href="${escapeHtml(
        d.link
      )}">Reset your password</a></p>`;
    case TplIds.PasswordAdminReset:
      return `<p>Hello ${escapeHtml(d.username)},</p><p>An administrator reset your password on ${escapeHtml(
        d.domain
      )}.</p><p>Your new password: <code>${escapeHtml(
        d.rawPassword
      )}</code></p><p>Please sign in and change it.</p>`;
    case TplIds.Test:
      return `<p>Test mail from ${escapeHtml(d.domain)}.</p>`;
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
