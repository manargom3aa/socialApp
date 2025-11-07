"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateEnum = void 0;
var EmailTemplateEnum;
(function (EmailTemplateEnum) {
    EmailTemplateEnum["CONFIRM_EMAIL"] = "confirm_email";
    EmailTemplateEnum["RESET_PASSWORD"] = "reset_password";
    EmailTemplateEnum["WELCOME"] = "welcome";
    EmailTemplateEnum["TWO_FACTOR_AUTH"] = "two_factor_auth";
    EmailTemplateEnum["EMAIL_UPDATE"] = "email_update";
    EmailTemplateEnum["EMAIL_UPDATED"] = "email_updated";
    EmailTemplateEnum["FRIEND_REQUEST"] = "friend_request";
    EmailTemplateEnum["ACCOUNT_FREEZED"] = "account_freezed";
    EmailTemplateEnum["ACCOUNT_RESTORED"] = "account_restored";
    EmailTemplateEnum["PASSWORD_CHANGED"] = "password_changed";
    EmailTemplateEnum["SECURITY_ALERT"] = "security_alert";
})(EmailTemplateEnum || (exports.EmailTemplateEnum = EmailTemplateEnum = {}));
