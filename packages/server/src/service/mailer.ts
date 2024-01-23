import { domainName, hostUrl } from "@common/functions";
import sendgrid from "@sendgrid/mail";

// ids for sendgrid templates
export enum TplIds {
  AccountCreated = "d-5b941a639a544c848f11240dfc3fc565",
  PasswordAdminReset = "d-a67dbe3a40234b6b8dc929f559553fe3",
  PasswordResetRequest = "d-9a386304d7eb45b6beba7fe1becba08d",
  Test = "d-382f8760c7be4ec4aba6bd8caf252eed",
}

// codenames for email subjects
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

/**
 * Template which should be sent to the new user email after registration
 * @param username
 * @param link
 * @returns
 */
export function accountCreatedTemplate(
  username: string,
  link: string
): DynamicTplRequest {
  return {
    id: TplIds.AccountCreated,
    data: {
      username,
      domain: domainName(),
      link,
    },
    subject: EmailSubject.AccountCreated,
  };
}

/**
 * Template which should be sent to the email which requested new password
 * @param email
 * @param link
 * @returns
 */
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

/**
 * Template which should be sent to the user for which an admin reset their password
 * @param username
 * @param rawPassword
 * @returns
 */
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

  constructor() {
    if (process.env.NODEMAILER_API_KEY && process.env.MAILER_SENDER) {
      this.devMode = false;
    }

    sendgrid.setApiKey(process.env.NODEMAILER_API_KEY || "");

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

    try {
      sendgrid.send({
        to: recipient,
        from: process.env.MAILER_SENDER || "",
        subject: tpl.subject,
        templateId: tpl.id,
        dynamicTemplateData: tpl.data,
      });
    } catch (e) {
      throw new Error(`Email error for template ${tpl.subject}: ${e}`);
    }
  }
}

const mailer: Mailer = new Mailer();
export default mailer;
