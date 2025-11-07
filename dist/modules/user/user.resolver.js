"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const graphql_1 = require("graphql");
const user_service_1 = require("./user.service");
class UserResolver {
    userService = new user_service_1.UserService();
    constructor() { }
    welcome = (parent, args) => {
        return this.userService.welcome();
    };
    allUsers = async (parent, args, context) => {
        return await this.userService.allUsers(args, context.user);
    };
    search = (args) => {
        const user = users.find((ele) => ele.email === args.email);
        if (!user) {
            throw new graphql_1.GraphQLError("fail to find matching result", {
                extensions: { statusCode: 404 },
            });
        }
        return {
            message: "User found successfully",
            statusCode: 200,
            data: user,
        };
    };
    addFollower = (parent, args) => {
        return this.userService.addFollower(args);
    };
}
exports.UserResolver = UserResolver;
