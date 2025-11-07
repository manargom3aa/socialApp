"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Events = void 0;
const node_events_1 = require("node:events");
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("./s3.config");
const user_model_1 = require("../../DB/models/user.model");
exports.s3Events = new node_events_1.EventEmitter();
exports.s3Events.on("s3:profileImageUploaded", (data) => {
    console.log({ data });
    setTimeout(async () => {
        const userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
        try {
            await (0, s3_config_1.getFile)({ Key: data.Key });
            await userModel.updateOne({
                filter: { _id: data.userId },
                update: { $unset: { tempProfileImage: 1 } },
            });
            await (0, s3_config_1.deleteFile)({ Key: data.oldKey });
            console.log("✅ Done");
        }
        catch (error) {
            console.log(error);
            if (error.Code === "NoSuchKey") {
                console.log({ eD: data });
                let unsetData = { tempProfileImage: 1 };
                if (!data.oldKey) {
                    unsetData = { tempProfileImage: 1, profileImage: 1 };
                }
                await userModel.updateOne({
                    filter: { _id: data.userId },
                    update: {
                        $unset: { tempProfileImage: 1 },
                        profileImage: data.oldKey,
                    },
                });
            }
        }
    }, data.expiresIn || 300000);
});
