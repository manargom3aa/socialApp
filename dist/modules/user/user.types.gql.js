"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.search = exports.allUsers = exports.welcome = exports.GraphQLOneUserResponse = exports.GraphQLRoleEnum = exports.GraphQLProviderEnum = exports.GraphQLGenderEnum = void 0;
const graphql_1 = require("graphql");
const models_1 = require("../../DB/models");
const types_gql_1 = require("../graphql/types.gql");
exports.GraphQLGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLGenderEnum",
    values: {
        male: { value: models_1.GenderEnum.male },
        female: { value: models_1.GenderEnum.female },
    },
});
exports.GraphQLProviderEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLProviderEnum",
    values: {
        google: { value: models_1.ProviderEnum.GOOGLE },
        system: { value: models_1.ProviderEnum.SYSTEM },
    },
});
exports.GraphQLRoleEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLRoleEnum",
    values: {
        admin: { value: models_1.RoleEnum.admin },
        user: { value: models_1.RoleEnum.user },
        superAdmin: { value: models_1.RoleEnum.superAdmin },
    },
});
exports.GraphQLOneUserResponse = new graphql_1.GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        id: { type: graphql_1.GraphQLID },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        userName: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        confirmEmailOtp: { type: graphql_1.GraphQLString },
        confirmedAt: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        resetPasswordOtp: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        profileImage: { type: graphql_1.GraphQLString },
        tempProfileImage: { type: graphql_1.GraphQLString },
        coverOfImages: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        gender: { type: exports.GraphQLGenderEnum },
        role: { type: exports.GraphQLRoleEnum },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        blocList: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        name: {
            type: graphql_1.GraphQLString,
            resolve: (user) => `${user.firstName} ${user.lastName}`,
        },
        followers: {
            type: new graphql_1.GraphQLList(graphql_1.GraphQLID),
        },
        updatedAt: { type: graphql_1.GraphQLString },
        createdAt: { type: graphql_1.GraphQLString },
    },
});
exports.welcome = new graphql_1.GraphQLNonNull(graphql_1.GraphQLString);
exports.allUsers = new graphql_1.GraphQLList(exports.GraphQLOneUserResponse);
exports.search = (0, types_gql_1.GraphQlUniformResponse)({
    name: "searchUser",
    data: new graphql_1.GraphQLNonNull(exports.GraphQLOneUserResponse),
});
exports.addFollower = new graphql_1.GraphQLList(exports.GraphQLOneUserResponse);
