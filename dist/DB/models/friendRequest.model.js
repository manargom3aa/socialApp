"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestModel = void 0;
const mongoose_1 = require("mongoose");
const friendRequestSchema = new mongoose_1.Schema({
    sendTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
    deletedAt: { type: Date, default: null },
}, { timestamps: true, strictQuery: true });
friendRequestSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        delete query.paranoid;
    }
    else {
        this.setQuery({ ...query, deletedAt: { $eq: null } });
    }
    next();
});
friendRequestSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        delete query.paranoid;
    }
    else {
        this.setQuery({ ...query, deletedAt: { $eq: null } });
    }
    next();
});
exports.FriendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)("FriendRequest", friendRequestSchema);
