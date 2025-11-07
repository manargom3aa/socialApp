"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const hash_security_1 = require("../../utils/security/hash.security");
const user_model_1 = require("../../DB/models/user.model");
const repository_1 = require("../../DB/repository");
const error_response_1 = require("../../utils/response/error.response");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
const email_tags_1 = require("../../utils/events/email.tags");
class AuthenticationService {
    userModel = new repository_1.UserRepository(user_model_1.UserModel);
    constructor() {
    }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequest("Fail to verify this google account");
        }
        return payload;
    }
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
            },
        });
        if (user) {
            if (user.provider === user_model_1.ProviderEnum.GOOGLE) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.ConflictException(`Email exist with another provider :::${user.provider}`);
        }
        const [newUser] = await this.userModel.create({
            data: [{ firstName: given_name, lastName: family_name, email: email, profileImage: picture, confirmedAt: new Date(), provider: user_model_1.ProviderEnum.GOOGLE }]
        }) || [];
        if (!newUser) {
            throw new error_response_1.BadRequest("Fail to signup with gmail please try again later");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return (0, success_response_1.successResponse)({ res, data: { credentials: { accessToken: credentials.access_token, refreshToken: credentials.refresh_token } }, statusCode: 201 });
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException(`Not Register account or registered with another provider`);
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({
            res,
            data: {
                credentials: {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token
                }
            }
        });
    };
    signup = async (req, res) => {
        let { userName, email, password } = req.body;
        const existingUser = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: true,
            },
        });
        if (existingUser) {
            throw new error_response_1.ConflictException("Email already exists");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.createUser({
            data: [{
                    userName,
                    email,
                    password,
                    confirmEmailOtp: `${otp}`
                }]
        });
        email_event_1.emailEvent.sendEmail(email_tags_1.EmailTemplateEnum.CONFIRM_EMAIL, {
            to: email,
            otp,
            userName,
            title: "Email Confirmation"
        });
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 201,
            message: "User created. OTP sent to email",
            data: { email: user.email, userName: user.userName },
        });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        if (!(await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp))) {
            throw new error_response_1.ConflictException("In-valid confirmation code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 },
            },
        });
        return (0, success_response_1.successResponse)({ res, message: "Email confirmed successfully" });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User not found");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequest("Please confirm your email first");
        }
        const isPasswordValid = await (0, hash_security_1.compareHash)(password, user.password);
        if (!isPasswordValid) {
            throw new error_response_1.ConflictException("Invalid login credentials");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({
            res,
            message: "Done",
            data: {
                credentials: {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token
                }
            }
        });
    };
    sendForgotCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: user_model_1.ProviderEnum.SYSTEM, confirmedAt: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp)),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Fail to send the reset code please try again later");
        }
        email_event_1.emailEvent.emit("resetPassword", { to: email, otp });
        return res.json({
            message: "Done"
        });
    };
    verifyForgotPassword = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: user_model_1.ProviderEnum.SYSTEM, resetPasswordOtp: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.ConflictException("invalid otp");
        }
        return res.json({
            message: "Done"
        });
    };
    resetForgotPassword = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: user_model_1.ProviderEnum.SYSTEM, resetPasswordOtp: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.ConflictException("invalid otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Fail to send the reset account password please try again later");
        }
        return res.json({
            message: "Done"
        });
    };
    updatePassword = async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;
        const user = await this.userModel.findOne({
            filter: { _id: userId, provider: user_model_1.ProviderEnum.SYSTEM },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User not found");
        }
        const isCurrentPasswordValid = await (0, hash_security_1.compareHash)(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new error_response_1.ConflictException("Current password is incorrect");
        }
        const isSamePassword = await (0, hash_security_1.compareHash)(newPassword, user.password);
        if (isSamePassword) {
            throw new error_response_1.ConflictException("New password must be different from current password");
        }
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                password: await (0, hash_security_1.generateHash)(newPassword),
                changeCredentialsTime: new Date(),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Failed to update password");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Password updated successfully",
        });
    };
}
exports.default = new AuthenticationService();
