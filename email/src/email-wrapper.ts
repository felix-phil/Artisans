import Email from "email-templates";
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";
import mg from "nodemailer-mailgun-transport";

class EmailWrapper {
  private _client?: Email;

  get client() {
    if (!this._client) {
      throw new Error("Mailer has not been initialized");
    }
    return this._client;
  }
  initializeMailer(apiKey: string, domain: string, preview = false) {
    const transporter = nodemailer.createTransport(
      mg({
        auth: {
          api_key: apiKey,
          domain: domain,
        },
      })
    );
    this._client = new Email({
      transport: transporter,
      send: true,
      preview: preview,
    });
  }
}

export const emailWrapper = new EmailWrapper();
