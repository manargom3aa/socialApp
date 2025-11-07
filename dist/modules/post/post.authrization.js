"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const user_model_1 = require("../../DB/models/user.model");
exports.endpoint = {
    restorePost: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
    viewFreezedPosts: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
    hardDeleteAnyPost: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
    freezeAnyPost: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
    systemSettings: [user_model_1.RoleEnum.superAdmin],
    userManagement: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
};
