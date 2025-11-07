"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const send_email_1 = require("../email/send.email");
const verify_template_email_1 = require("../email/verify.template.email");
const email_tags_1 = require("./email.tags");
class EmailEvent extends node_events_1.EventEmitter {
    constructor() {
        super();
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.on(email_tags_1.EmailTemplateEnum.CONFIRM_EMAIL, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Confirm Your Email",
                    html: (0, verify_template_email_1.verifyEmail)({
                        otp: data.otp,
                        title: data.title || "Email Confirmation"
                    })
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Confirm email sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send confirmEmail to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.RESET_PASSWORD, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Reset Your Password",
                    html: (0, verify_template_email_1.verifyEmail)({
                        otp: data.otp,
                        title: data.title || "Reset Code"
                    })
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Reset password email sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send resetPassword to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.TWO_FACTOR_AUTH, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Your Two-Factor Authentication Code",
                    html: (0, verify_template_email_1.verifyEmail)({
                        otp: data.otp,
                        title: data.title || "2FA Code"
                    })
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ 2FA email sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send twoFactorAuth to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.WELCOME, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Welcome to Our Platform!",
                    html: this.generateWelcomeTemplate(data.userName)
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Welcome email sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send welcome email to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.EMAIL_UPDATE, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Verify Your New Email Address",
                    html: (0, verify_template_email_1.verifyEmail)({
                        otp: data.otp,
                        title: data.title || "Email Update Verification"
                    })
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Email update verification sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send emailUpdate to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.EMAIL_UPDATED, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Email Address Updated",
                    html: this.generateEmailUpdatedTemplate(data.newEmail, data.userName)
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Email updated notification sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send emailUpdated to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.SECURITY_ALERT, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Security Alert",
                    html: this.generateSecurityAlertTemplate(data)
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Security alert sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send securityAlert to ${data.to}`, error);
            }
        });
        this.on(email_tags_1.EmailTemplateEnum.ACCOUNT_FREEZED, async (data) => {
            try {
                const emailData = {
                    to: data.to,
                    subject: data.subject || "Account Suspended",
                    html: this.generateAccountFreezedTemplate(data)
                };
                await (0, send_email_1.sendEmail)(emailData);
                console.log(`✅ Account freezed notification sent to: ${data.to}`);
            }
            catch (error) {
                console.error(`❌ Fail to send accountFreezed to ${data.to}`, error);
            }
        });
    }
    generateWelcomeTemplate(userName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { color: #333; text-align: center; }
          .message { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🎉 Welcome to Our Platform!</h1>
          <div class="message">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We're excited to have you on board! Your account has been successfully created.</p>
            <p>Start exploring all the features we have to offer.</p>
            <p>Best regards,<br>The Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateEmailUpdatedTemplate(newEmail, userName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { color: #333; text-align: center; }
          .message { color: #666; line-height: 1.6; }
          .highlight { background-color: #f0f8ff; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">✉️ Email Address Updated</h1>
          <div class="message">
            <p>Hello <strong>${userName || 'User'}</strong>,</p>
            <p>Your email address has been successfully updated to:</p>
            <div class="highlight">
              <strong>${newEmail}</strong>
            </div>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateSecurityAlertTemplate(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #fff5f5; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 2px solid #ff6b6b; }
          .header { color: #d63031; text-align: center; }
          .message { color: #666; line-height: 1.6; }
          .alert { background-color: #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🚨 Security Alert</h1>
          <div class="message">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <div class="alert">
              <p><strong>Alert Type:</strong> ${data.alertType}</p>
              ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
              ${data.device ? `<p><strong>Device:</strong> ${data.device}</p>` : ''}
            </div>
            <p>If this wasn't you, please secure your account immediately.</p>
            <p>Best regards,<br>Security Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateAccountFreezedTemplate(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #fff5f5; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 2px solid #ff6b6b; }
          .header { color: #d63031; text-align: center; }
          .message { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">❄️ Account Suspended</h1>
          <div class="message">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Your account has been temporarily suspended.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>If you believe this is a mistake, please contact our support team.</p>
            <p>Best regards,<br>Support Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    sendEmail(template, data) {
        this.emit(template, data);
    }
}
exports.emailEvent = new EmailEvent();
