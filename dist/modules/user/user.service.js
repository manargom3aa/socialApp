"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_1 = require("../../DB/repository/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const token_security_1 = require("../../utils/security/token.security");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_events_1 = require("../../utils/multer/s3.events");
const success_response_1 = require("../../utils/response/success.response");
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const models_1 = require("../../DB/models");
const graphql_1 = require("graphql");
const email_event_1 = require("../../utils/events/email.event");
const hash_security_1 = require("../../utils/security/hash.security");
const otp_1 = require("../../utils/otp");
const user_model_2 = require("../../DB/models/user.model");
let users = [
    {
        id: 1,
        name: "manar",
        email: "jkk@gmail.com",
        gender: user_model_1.GenderEnum.female,
        password: "grrw4vf",
        followers: [],
    },
    {
        id: 2,
        name: "mona",
        email: "jkdk@gmail.com",
        gender: user_model_1.GenderEnum.female,
        password: "grrw4dvf",
        followers: [],
    }
];
class UserService {
    userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    postModel = new repository_1.PostRepository(models_1.PostModel);
    friendRequestModel = new repository_1.FriendRequestRepository(models_1.FriendRequestModel);
    chatModel = new repository_1.ChatRepository(models_1.ChatModel);
    constructor() { }
    profile = async (req, res) => {
        const profile = await this.userModel.findById({
            id: req.user?._id,
            options: {
                populate: [
                    {
                        path: "friends",
                        select: "firstName lastName email gender profilePicture",
                    },
                ],
            },
        });
        if (!profile) {
            throw new error_response_1.NotFoundException("fail to find user profile");
        }
        const groups = await this.chatModel.find({
            filter: {
                participants: { $in: req.user?._id },
                group: { $exists: true },
            },
        });
        return (0, success_response_1.successResponse)({ res, data: { user: profile, groups } });
    };
    dashboard = async (req, res) => {
        const results = await Promise.allSettled([
            this.userModel.find({ filter: {} }),
            this.postModel.find({ filter: {} })
        ]);
        return (0, success_response_1.successResponse)({
            res, data: { results }
        });
    };
    updateBasicInfo = async (req, res) => {
        const data = req.body;
        const userId = req.user?._id;
        const user = await this.userModel.findOneAndUpdate({
            filter: { _id: userId },
            update: data,
            options: { new: true },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User not found");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Profile updated successfully",
            data: { user },
        });
    };
    updateEmail = async (req, res) => {
        const { newEmail, password } = req.body;
        const userId = req.user?._id;
        const currentEmail = req.user?.email;
        if (newEmail === currentEmail) {
            throw new error_response_1.ConflictException("New email must be different from current email");
        }
        const isPasswordValid = await (0, hash_security_1.compareHash)(password, req.user?.password);
        if (!isPasswordValid) {
            throw new error_response_1.ConflictException("Invalid password");
        }
        const existingUser = await this.userModel.findOne({
            filter: {
                email: newEmail,
                _id: { $ne: userId }
            }
        });
        if (existingUser) {
            throw new error_response_1.ConflictException("Email already exists");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const hashedOtp = await (0, hash_security_1.generateHash)(String(otp));
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                newEmail: newEmail,
                confirmEmailOtp: hashedOtp,
                confirmEmailOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Failed to initiate email update");
        }
        email_event_1.emailEvent.emit("confirmEmailUpdate", {
            to: newEmail,
            otp,
            currentEmail: currentEmail
        });
        return (0, success_response_1.successResponse)({
            res,
            message: "Verification code sent to your new email address",
            data: {
                email: newEmail,
                expiresIn: "10 minutes"
            }
        });
    };
    confirmEmailUpdate = async (req, res) => {
        const { otp } = req.body;
        const userId = req.user?._id;
        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                newEmail: { $exists: true },
                confirmEmailOtp: { $exists: true },
                confirmEmailOtpExpires: { $gt: new Date() }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid or expired verification code");
        }
        const isOtpValid = await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp);
        if (!isOtpValid) {
            throw new error_response_1.ConflictException("Invalid verification code");
        }
        const updateResult = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                email: user.newEmail,
                changeCredentialsTime: new Date(),
                $unset: {
                    newEmail: 1,
                    confirmEmailOtp: 1,
                    confirmEmailOtpExpires: 1
                }
            }
        });
        if (!updateResult.matchedCount) {
            throw new error_response_1.BadRequest("Failed to update email");
        }
        email_event_1.emailEvent.emit("emailUpdated", {
            to: user.email,
            newEmail: user.newEmail
        });
        email_event_1.emailEvent.emit("emailUpdateConfirmed", {
            to: user.newEmail
        });
        return (0, success_response_1.successResponse)({
            res,
            message: "Email updated successfully"
        });
    };
    changeRole = async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body;
        const denyRoles = [role, user_model_1.RoleEnum.superAdmin];
        if (req.user?.role === user_model_1.RoleEnum.admin) {
            denyRoles.push(user_model_1.RoleEnum.admin);
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId,
                role: { $nin: denyRoles }
            },
            update: {
                role,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("fail to find matching result");
        }
        return (0, success_response_1.successResponse)({
            res
        });
    };
    enable2FA = async (req, res) => {
        const { password } = req.body;
        const userId = req.user?._id;
        const isPasswordValid = await (0, hash_security_1.compareHash)(password, req.user?.password);
        if (!isPasswordValid) {
            throw new error_response_1.ConflictException("Invalid password");
        }
        if (req.user?.twoFactorAuth !== user_model_2.TwoFactorAuthEnum.DISABLED) {
            throw new error_response_1.ConflictException("Two-factor authentication is already enabled");
        }
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                twoFactorAuth: user_model_2.TwoFactorAuthEnum.EMAIL,
                twoFactorAuthEnabledAt: new Date(),
                $unset: {
                    twoFactorAuthDisabledAt: 1,
                    twoFactorAuthOtp: 1,
                    twoFactorAuthOtpExpires: 1
                }
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Failed to enable two-factor authentication");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Two-factor authentication enabled successfully"
        });
    };
    disable2FA = async (req, res) => {
        const { password } = req.body;
        const userId = req.user?._id;
        const isPasswordValid = await (0, hash_security_1.compareHash)(password, req.user?.password);
        if (!isPasswordValid) {
            throw new error_response_1.ConflictException("Invalid password");
        }
        if (req.user?.twoFactorAuth === user_model_2.TwoFactorAuthEnum.DISABLED) {
            throw new error_response_1.ConflictException("Two-factor authentication is already disabled");
        }
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                twoFactorAuth: user_model_2.TwoFactorAuthEnum.DISABLED,
                twoFactorAuthDisabledAt: new Date(),
                $unset: {
                    twoFactorAuthEnabledAt: 1,
                    twoFactorAuthOtp: 1,
                    twoFactorAuthOtpExpires: 1
                }
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Failed to disable two-factor authentication");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Two-factor authentication disabled successfully"
        });
    };
    send2FACode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                twoFactorAuth: user_model_2.TwoFactorAuthEnum.EMAIL,
                confirmedAt: { $exists: true }
            }
        });
        if (!user) {
            return (0, success_response_1.successResponse)({
                res,
                message: "If your account exists and has 2FA enabled, a verification code has been sent"
            });
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const result = await this.userModel.updateOne({
            filter: { _id: user._id },
            update: {
                twoFactorAuthOtp: otp,
                twoFactorAuthOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("Failed to send verification code");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Verification code sent to your email"
        });
    };
    verify2FA = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                twoFactorAuth: user_model_2.TwoFactorAuthEnum.EMAIL,
                twoFactorAuthOtp: { $exists: true },
                twoFactorAuthOtpExpires: { $gt: new Date() }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid or expired verification code");
        }
        const isOtpValid = await (0, hash_security_1.compareHash)(otp, user.twoFactorAuthOtp);
        if (!isOtpValid) {
            throw new error_response_1.ConflictException("Invalid verification code");
        }
        await this.userModel.updateOne({
            filter: { _id: user._id },
            update: {
                $unset: {
                    twoFactorAuthOtp: 1,
                    twoFactorAuthOtpExpires: 1
                }
            }
        });
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({
            res,
            message: "Two-factor authentication verified successfully",
            data: {
                credentials: {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token
                },
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    twoFactorAuth: user.twoFactorAuth
                }
            }
        });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkFriendRequestExist = await this.friendRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
            },
        });
        if (checkFriendRequestExist) {
            throw new error_response_1.ConflictException("Friend Request already exist");
        }
        const user = await this.userModel.findOne({ filter: { _id: userId } });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid recipient");
        }
        const [friendRequest] = (await this.friendRequestModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    sendTo: userId,
                },
            ],
        })) || [];
        if (!friendRequest) {
            throw new error_response_1.BadRequest("something went wrong...!");
        }
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 201,
        });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const friendRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false },
            },
            update: {
                acceptedAt: new Date(),
            },
        });
        if (!friendRequest) {
            throw new error_response_1.NotFoundException("fail to find match result");
        }
        await Promise.all([
            await this.userModel.updateOne({
                filter: { _id: friendRequest.createdBy },
                update: {
                    $addToSet: { friends: friendRequest.sendTo },
                },
            }),
            await this.userModel.updateOne({
                filter: { _id: friendRequest.sendTo },
                update: {
                    $addToSet: { friends: friendRequest.createdBy },
                },
            })
        ]);
        return (0, success_response_1.successResponse)({
            res,
        });
    };
    deleteFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const result = await this.friendRequestModel.deleteOne({
            filter: { _id: requestId },
        });
        if (!result.deletedCount) {
            throw new error_response_1.NotFoundException("Friend request not found");
        }
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 200,
            message: "Friend request deleted successfully",
        });
    };
    unFriend = async (req, res) => {
        const { friendId } = req.params;
        const userId = req.user?._id;
        const userUpdate = await this.userModel.updateOne({
            filter: { _id: userId },
            update: { $pull: { friends: friendId } },
        });
        await this.userModel.updateOne({
            filter: { _id: friendId },
            update: { $pull: { friends: userId } },
        });
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 200,
            message: "Unfriended successfully",
        });
    };
    blockUser = async (req, res) => {
        const { userId } = req.params;
        const { reason } = req.body;
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                $set: {
                    blockedAt: new Date(),
                    blockedBy: req.user?._id,
                    blockReason: reason || "No reason provided"
                }
            }
        });
        if (!result.matchedCount)
            throw new error_response_1.NotFoundException("User not found");
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 200,
            message: "User blocked successfully",
        });
    };
    ProfileImage = async (req, res) => {
        const { ContentType, originalname, } = req.body;
        const { url, key } = await (0, s3_config_1.createPreSignedUploadLink)({
            ContentType,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: new mongoose_1.Types.ObjectId(req.decoded?._id),
            update: {
                profileImage: key,
                tempProfileImage: req.user?.profileImage,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequest("Fail to update profile image");
        }
        s3_events_1.s3Events.emit("trackProfileImageUpload", {
            userId: req.decoded?._id,
            Key: key,
            oldKey: req.user?.profileImage,
            expiresIn: 300000,
        });
        return (0, success_response_1.successResponse)({ res, data: { url } });
    };
    ProfileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: new mongoose_1.Types.ObjectId(req.decoded?._id),
            update: {
                coverOfImages: urls,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequest("Fail to update cover image");
        }
        if (req.user?.coverOfImages) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user.coverOfImages });
        }
        return (0, success_response_1.successResponse)({ res, data: { user } });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return res.status(statusCode).json({
            message: "Done",
        });
    };
    refreshToken = async (req, res) => {
        const rawCredentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        const credentials = {
            accessToken: rawCredentials.access_token,
            refreshToken: rawCredentials.refresh_token
        };
        return (0, success_response_1.successResponse)({ res, data: { credentials }, statusCode: 201 });
    };
    welcome = () => {
        return "Welcome";
    };
    allUsers = async (args, authUser) => {
        return await this.userModel.find({
            filter: {
                _id: { $ne: authUser._id },
                gender: args.gender,
            },
        });
    };
    search = (args) => {
        const user = users.find((ele) => ele.email === args.email);
        if (!user) {
            throw new graphql_1.GraphQLError("fail to find matching result", {
                extensions: { statusCode: 404 },
            });
        }
        return user;
    };
    addFollower = (args) => {
        users = users.map((ele) => {
            if (ele.id === args.friendId) {
                ele.followers.push(args.myId);
            }
            return ele;
        });
        return users;
    };
}
exports.UserService = UserService;
exports.default = new UserService();
