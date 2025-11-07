import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { AllowCommentsEnum, AvailabilityEnum } from "../../DB/models";

export const GraphQLAllowCommentsEnum = new GraphQLEnumType({
    name: "GraphQLAllowCommentsEnum",
    values: {
        allow: { value: AllowCommentsEnum.allow },
        deny: { value: AllowCommentsEnum.deny },
    },
})
export const GraphQLAvailabilityEnum = new GraphQLEnumType({
    name: "GraphQLAvailabilityEnum",
    values: {
        onlyMe: { value: AvailabilityEnum.onlyMe },
        friends: { value: AvailabilityEnum.friends},
        public: { value: AvailabilityEnum.public},

    },
})
export const GraphQLOnePostResponse = new GraphQLObjectType({
    name: "OnePostResponse",
    fields:{
                id: { type: GraphQLID },
        
             content: {type: GraphQLString},
              attachments: {type: GraphQLString},
              allowComments: { type: GraphQLAllowCommentsEnum },
              availability: { type: GraphQLAvailabilityEnum },
              assetsFolderId: {type:new GraphQLList( GraphQLString)},
              tags: { type: new GraphQLList (GraphQLID) },
              likes: { type:new GraphQLList (GraphQLID) },
              comments: { type: GraphQLID },
              shares: { type: GraphQLID },
              createdBy: { type: GraphQLID },
              freezedBy: { type: GraphQLID },
              freezedAt: {type: GraphQLString},
              restoredBy:{ type: GraphQLID },
              restoredAt: {type: GraphQLString},
              createdAt: {type: GraphQLString},
              updatedAt: {type: GraphQLString},
    }
})

export const allPosts = new GraphQLList(GraphQLOnePostResponse)