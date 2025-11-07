"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.blockUser = exports.restoreAccount = exports.send2FACode = exports.verify2FA = exports.disable2FA = exports.enable2FA = exports.confirmEmailUpdate = exports.updateEmail = exports.updateBasicInfo = exports.freezeAccount = exports.changeRole = exports.acceptFriendRequest = exports.sendFriendRequest = exports.logout = void 0;
const zod_1 = __importDefault(require("zod"));
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const models_1 = require("../../DB/models");
exports.logout = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(token_security_1.LogoutEnum).default(token_security_1.LogoutEnum.only)
    })
};
exports.sendFriendRequest = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id
    }),
};
exports.acceptFriendRequest = {
    params: zod_1.default.strictObject({
        requestId: validation_middleware_1.generalFields.id
    }),
};
exports.changeRole = {
    params: exports.sendFriendRequest.params,
    body: zod_1.default.strictObject({
        role: zod_1.default.enum(models_1.RoleEnum),
    })
};
exports.freezeAccount = {
    params: zod_1.default.object({
        userId: zod_1.default.string().optional(),
    })
        .optional()
        .refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "invalid object format",
        path: ["userId"],
    })
};
exports.updateBasicInfo = {
    body: zod_1.default.strictObject({
        firstName: zod_1.default.string().min(2).max(50).optional(),
        lastName: zod_1.default.string().min(2).max(50).optional(),
        userName: zod_1.default.string().min(3).max(30).optional(),
        gender: zod_1.default.enum(models_1.GenderEnum).optional(),
        bio: zod_1.default.string().max(500).optional(),
        phone: zod_1.default.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
        dateOfBirth: zod_1.default.string().datetime().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    })
};
exports.updateEmail = {
    body: zod_1.default.strictObject({
        newEmail: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.confirmEmailUpdate = {
    body: zod_1.default.strictObject({
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.enable2FA = {
    body: zod_1.default.strictObject({
        password: validation_middleware_1.generalFields.password,
    })
};
exports.disable2FA = {
    body: zod_1.default.strictObject({
        password: validation_middleware_1.generalFields.password,
    })
};
exports.verify2FA = {
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.send2FACode = {
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
    })
};
exports.restoreAccount = {
    params: zod_1.default.object({
        userId: zod_1.default.string(),
    })
        .refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data.userId);
    }, {
        error: "invalid object format",
        path: ["userId"],
    })
};
exports.blockUser = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id
    }),
    body: zod_1.default.strictObject({
        reason: zod_1.default.string().min(5).max(500).optional()
    })
};
exports.hardDelete = exports.restoreAccount;
