"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQLOnePostResponse = exports.GraphQLAvailabilityEnum = exports.GraphQLAllowCommentsEnum = void 0;
const graphql_1 = require("graphql");
const models_1 = require("../../DB/models");
exports.GraphQLAllowCommentsEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLAllowCommentsEnum",
    values: {
        allow: { value: models_1.AllowCommentsEnum.allow },
        deny: { value: models_1.AllowCommentsEnum.deny },
    },
});
exports.GraphQLAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: "GraphQLAvailabilityEnum",
    values: {
        onlyMe: { value: models_1.AvailabilityEnum.onlyMe },
        friends: { value: models_1.AvailabilityEnum.friends },
        public: { value: models_1.AvailabilityEnum.public },
    },
});
exports.GraphQLOnePostResponse = new graphql_1.GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
        id: { type: graphql_1.GraphQLID },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: graphql_1.GraphQLString },
        allowComments: { type: exports.GraphQLAllowCommentsEnum },
        availability: { type: exports.GraphQLAvailabilityEnum },
        assetsFolderId: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        comments: { type: graphql_1.GraphQLID },
        shares: { type: graphql_1.GraphQLID },
        createdBy: { type: graphql_1.GraphQLID },
        freezedBy: { type: graphql_1.GraphQLID },
        freezedAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    }
});
exports.allPosts = new graphql_1.GraphQLList(exports.GraphQLOnePostResponse);
