"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const user_model_1 = require("../../DB/models/user.model");
exports.endpoint = {
    welcome: [user_model_1.RoleEnum.user, user_model_1.RoleEnum.admin],
    profile: [user_model_1.RoleEnum.user],
    dashboard: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
    viewFreezedPosts: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
};
