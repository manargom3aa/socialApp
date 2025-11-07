// utils/events/email.event.ts
import { EventEmitter } from "node:events";
import { sendEmail } from "../email/send.email";
import Mail from "nodemailer/lib/mailer";
import { verifyEmail } from "../email/verify.template.email";
import { EmailTemplateEnum, EmailEventData, IEmailTags } from "./email.tags";

class EmailEvent extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Confirm Email - الحفاظ على السلوك الحالي
    this.on(EmailTemplateEnum.CONFIRM_EMAIL, async (data: EmailEventData<EmailTemplateEnum.CONFIRM_EMAIL>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Confirm Your Email",
          html: verifyEmail({ 
            otp: data.otp, 
            title: data.title || "Email Confirmation" 
          })
        };
        
        await sendEmail(emailData);
        console.log(`✅ Confirm email sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send confirmEmail to ${data.to}`, error);
      }
    });

    // Reset Password - الحفاظ على السلوك الحالي
    this.on(EmailTemplateEnum.RESET_PASSWORD, async (data: EmailEventData<EmailTemplateEnum.RESET_PASSWORD>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Reset Your Password",
          html: verifyEmail({ 
            otp: data.otp, 
            title: data.title || "Reset Code" 
          })
        };
        
        await sendEmail(emailData);
        console.log(`✅ Reset password email sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send resetPassword to ${data.to}`, error);
      }
    });

    // Two Factor Authentication - جديد
    this.on(EmailTemplateEnum.TWO_FACTOR_AUTH, async (data: EmailEventData<EmailTemplateEnum.TWO_FACTOR_AUTH>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Your Two-Factor Authentication Code",
          html: verifyEmail({ 
            otp: data.otp, 
            title: data.title || "2FA Code" 
          })
        };
        
        await sendEmail(emailData);
        console.log(`✅ 2FA email sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send twoFactorAuth to ${data.to}`, error);
      }
    });

    // Welcome Email - جديد
    this.on(EmailTemplateEnum.WELCOME, async (data: EmailEventData<EmailTemplateEnum.WELCOME>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Welcome to Our Platform!",
          html: this.generateWelcomeTemplate(data.userName)
        };
        
        await sendEmail(emailData);
        console.log(`✅ Welcome email sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send welcome email to ${data.to}`, error);
      }
    });

    // Email Update Verification - جديد
    this.on(EmailTemplateEnum.EMAIL_UPDATE, async (data: EmailEventData<EmailTemplateEnum.EMAIL_UPDATE>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Verify Your New Email Address",
          html: verifyEmail({ 
            otp: data.otp, 
            title: data.title || "Email Update Verification" 
          })
        };
        
        await sendEmail(emailData);
        console.log(`✅ Email update verification sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send emailUpdate to ${data.to}`, error);
      }
    });

    // Email Updated Notification - جديد
    this.on(EmailTemplateEnum.EMAIL_UPDATED, async (data: EmailEventData<EmailTemplateEnum.EMAIL_UPDATED>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Email Address Updated",
          html: this.generateEmailUpdatedTemplate(data.newEmail, data.userName)
        };
        
        await sendEmail(emailData);
        console.log(`✅ Email updated notification sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send emailUpdated to ${data.to}`, error);
      }
    });

    // Security Alert - جديد
    this.on(EmailTemplateEnum.SECURITY_ALERT, async (data: EmailEventData<EmailTemplateEnum.SECURITY_ALERT>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Security Alert",
          html: this.generateSecurityAlertTemplate(data)
        };
        
        await sendEmail(emailData);
        console.log(`✅ Security alert sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send securityAlert to ${data.to}`, error);
      }
    });

    // Account Freezed - جديد
    this.on(EmailTemplateEnum.ACCOUNT_FREEZED, async (data: EmailEventData<EmailTemplateEnum.ACCOUNT_FREEZED>) => {
      try {
        const emailData: Mail.Options = {
          to: data.to,
          subject: data.subject || "Account Suspended",
          html: this.generateAccountFreezedTemplate(data)
        };
        
        await sendEmail(emailData);
        console.log(`✅ Account freezed notification sent to: ${data.to}`);
      } catch (error) {
        console.error(`❌ Fail to send accountFreezed to ${data.to}`, error);
      }
    });
  }

  // دالة مساعدة لإنشاء قالب الترحيب
  private generateWelcomeTemplate(userName: string): string {
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

  // دالة مساعدة لإنشاء قالب تحديث البريد الإلكتروني
  private generateEmailUpdatedTemplate(newEmail: string, userName?: string): string {
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

  // دالة مساعدة لإنشاء قالب التنبيه الأمني
  private generateSecurityAlertTemplate(data: EmailEventData<EmailTemplateEnum.SECURITY_ALERT>): string {
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

  // دالة مساعدة لإنشاء قالب تجميد الحساب
  private generateAccountFreezedTemplate(data: EmailEventData<EmailTemplateEnum.ACCOUNT_FREEZED>): string {
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

  // Public method لإرسال الإيميلات مع type safety
  sendEmail<T extends EmailTemplateEnum>(template: T, data: EmailEventData<T>) {
    this.emit(template, data);
  }
}

export const emailEvent = new EmailEvent();