"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.RoleEnum = exports.ProviderEnum = exports.TwoFactorAuthEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/events/email.event");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var TwoFactorAuthEnum;
(function (TwoFactorAuthEnum) {
    TwoFactorAuthEnum["DISABLED"] = "disabled";
    TwoFactorAuthEnum["EMAIL"] = "email";
})(TwoFactorAuthEnum || (exports.TwoFactorAuthEnum = TwoFactorAuthEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["GOOGLE"] = "GOOGLE";
    ProviderEnum["SYSTEM"] = "SYSTEM";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
    RoleEnum["superAdmin"] = "super-admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, minLength: 2, maxLength: 25 },
    lastName: { type: String, minLength: 2, maxLength: 25 },
    slug: { type: String, minLength: 5, maxLength: 51 },
    email: { type: String, required: true, unique: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.GOOGLE ? false : true;
        }
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },
    phone: { type: String },
    address: { type: String },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    coverOfImages: [String],
    freezedAt: { type: Date },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    friends: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.SYSTEM },
    twoFactorAuth: {
        type: String,
        enum: Object.values(TwoFactorAuthEnum),
        default: TwoFactorAuthEnum.DISABLED
    },
    twoFactorAuthOtp: {
        type: String,
        select: false
    },
    twoFactorAuthOtpExpires: {
        type: Date,
        select: false
    },
    twoFactorAuthEnabledAt: {
        type: Date
    },
    twoFactorAuthDisabledAt: {
        type: Date
    },
    newEmail: {
        type: String
    },
    confirmEmailOtpExpires: {
        type: Date
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
})
    .get(function () {
    return this.firstName + " " + this.lastName;
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, hash_security_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOtp") && this.confirmEmailOtp) {
        this.confirmEmailOtp = await (0, hash_security_1.generateHash)(this.confirmEmailOtp);
        this.confirmEmailPlainOtp = this.confirmEmailOtp;
    }
    if (this.isModified("twoFactorAuthOtp") && this.twoFactorAuthOtp) {
        this.twoFactorAuthOtp = await (0, hash_security_1.generateHash)(this.twoFactorAuthOtp);
        this.twoFactorAuthPlainOtp = this.twoFactorAuthOtp;
    }
    next();
});
userSchema.post("save", async function (doc, next) {
    const that = this;
    if (that.wasNew && that.confirmEmailPlainOtp) {
        email_event_1.emailEvent.emit("confirmEmail", {
            to: doc.email,
            otp: that.confirmEmailPlainOtp,
        });
    }
    if (that.twoFactorAuthPlainOtp && doc.twoFactorAuth === TwoFactorAuthEnum.EMAIL) {
        email_event_1.emailEvent.emit("send2FACode", {
            to: doc.email,
            otp: that.twoFactorAuthPlainOtp,
            userName: doc.userName || doc.firstName
        });
    }
    next();
});
userSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query, deletedAt: { $exists: true } });
    }
    next();
});
userSchema.index({ email: 1 });
userSchema.index({ twoFactorAuth: 1 });
userSchema.index({ twoFactorAuthOtpExpires: 1 }, { expireAfterSeconds: 0 });
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
