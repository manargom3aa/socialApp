"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.graphValidation = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const error_response_1 = require("../utils/response/error.response");
const mongoose_1 = require("mongoose");
const graphql_1 = require("graphql");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                });
            }
        }
        if (validationErrors.length) {
            throw new error_response_1.BadRequest("Validation Error", {
                validationErrors,
            });
        }
        next();
    };
};
exports.validation = validation;
const graphValidation = async (schema, args) => {
    const validationResult = await schema.safeParseAsync(args);
    if (!validationResult.success) {
        const ZodError = validationResult.error;
        throw new graphql_1.GraphQLError("validation Error", {
            extensions: {
                statusCode: 400,
                issues: {
                    key: "args",
                    issues: ZodError.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                },
            },
        });
    }
};
exports.graphValidation = graphValidation;
exports.generalFields = {
    username: zod_1.default.string().min(2).max(20),
    email: zod_1.default.string().email({
        message: "Valid email must be like example@domain.com",
    }),
    password: zod_1.default
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, "Password must be at least 8 characters, include uppercase, lowercase, and a number"),
    confirmPassword: zod_1.default.string(),
    otp: zod_1.default
        .string()
        .length(6)
        .regex(/^[0-9]{6}$/, "OTP must contain only numbers"),
    file: function (mimetype) {
        return zod_1.default.strictObject({
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            encoding: zod_1.default.string(),
            mimetype: zod_1.default.enum(mimetype),
            size: zod_1.default.number().max(5 * 1024 * 1024, "File size should not exceed 5MB"),
            path: zod_1.default.string().optional(),
            buffer: zod_1.default.any().optional(),
            filename: zod_1.default.string().optional(),
        }).refine((data) => data.buffer || data.path, { message: "neither buffer nor path is provided", path: ['file'] });
    },
    id: zod_1.default.string().refine((data) => mongoose_1.Types.ObjectId.isValid(data), { message: "invalid object format", path: ['id'] })
};
