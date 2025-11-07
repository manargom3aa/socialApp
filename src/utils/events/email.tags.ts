
export enum EmailTemplateEnum {
  CONFIRM_EMAIL = "confirm_email",
  RESET_PASSWORD = "reset_password",
  WELCOME = "welcome",
  TWO_FACTOR_AUTH = "two_factor_auth",
  EMAIL_UPDATE = "email_update",
  EMAIL_UPDATED = "email_updated",
  FRIEND_REQUEST = "friend_request",
  ACCOUNT_FREEZED = "account_freezed",
  ACCOUNT_RESTORED = "account_restored",
  PASSWORD_CHANGED = "password_changed",
  SECURITY_ALERT = "security_alert"
}

export interface IEmailTags {
  [EmailTemplateEnum.CONFIRM_EMAIL]: {
    to: string;
    otp: string;
    userName?: string;
  };
  [EmailTemplateEnum.RESET_PASSWORD]: {
    to: string;
    otp: string;
    userName?: string;
  };
  [EmailTemplateEnum.WELCOME]: {
    to: string;
    userName: string;
  };
  [EmailTemplateEnum.TWO_FACTOR_AUTH]: {
    to: string;
    otp: string;
    userName?: string;
  };
  [EmailTemplateEnum.EMAIL_UPDATE]: {
    to: string;
    otp: string;
    currentEmail: string;
    userName?: string;
  };
  [EmailTemplateEnum.EMAIL_UPDATED]: {
    to: string;
    newEmail: string;
    userName?: string;
  };
  [EmailTemplateEnum.FRIEND_REQUEST]: {
    to: string;
    fromUserName: string;
    requestId: string;
  };
  [EmailTemplateEnum.ACCOUNT_FREEZED]: {
    to: string;
    userName: string;
    reason?: string;
  };
  [EmailTemplateEnum.ACCOUNT_RESTORED]: {
    to: string;
    userName: string;
  };
  [EmailTemplateEnum.PASSWORD_CHANGED]: {
    to: string;
    userName: string;
  };
  [EmailTemplateEnum.SECURITY_ALERT]: {
    to: string;
    userName: string;
    alertType: string;
    location?: string;
    device?: string;
  };
}

export type EmailEventData<T extends EmailTemplateEnum> = IEmailTags[T];