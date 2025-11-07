import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../DB/models";
import { GraphQlUniformResponse } from "../graphql/types.gql";

export const GraphQLGenderEnum = new GraphQLEnumType({
    name: "GraphQLGenderEnum",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female },
    },
})

export const GraphQLProviderEnum = new GraphQLEnumType({
    name: "GraphQLProviderEnum",
    values: {
        google: { value: ProviderEnum.GOOGLE },
        system: { value: ProviderEnum.SYSTEM },
    },
})

export const GraphQLRoleEnum = new GraphQLEnumType({
    name: "GraphQLRoleEnum",
    values: {
        admin: { value: RoleEnum.admin },
        user: { value: RoleEnum.user },
        superAdmin: { value: RoleEnum.superAdmin },
    },
})

export const GraphQLOneUserResponse = new GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        id: { type: GraphQLID },
     firstName: {type: GraphQLString},
  lastName:{type: GraphQLString},
  userName: {type: GraphQLString},
  slug: {type: GraphQLString},

  email: {type: GraphQLString},
  confirmEmailOtp:{type: GraphQLString},
  confirmedAt:{type: GraphQLString},


  password:{type: GraphQLString},
  resetPasswordOtp:{type: GraphQLString},
  changeCredentialsTime:{type: GraphQLString},

  phone: {type: GraphQLString},
  address:{type: GraphQLString},

  profileImage:{type: GraphQLString},
  tempProfileImage:{type: GraphQLString},

  coverOfImages:{type: new GraphQLList(GraphQLString)},

  gender: {type:GraphQLGenderEnum},
  role: {type:GraphQLRoleEnum},

  freezedAt: {type: GraphQLString},
  freezedBy:  {type: GraphQLID},
  restoredAt: {type: GraphQLString},
  restoredBy: {type: GraphQLID},
  friends:  {type: new  GraphQLList(GraphQLID)},
  blocList:{type: new  GraphQLList(GraphQLID)},

      name: {
      type: GraphQLString,
      resolve: (user) => `${user.firstName} ${user.lastName}`,
    },

    followers: {
      type: new GraphQLList(GraphQLID),
    },

  updatedAt: {type: GraphQLString},
  createdAt: {type: GraphQLString},
    },
})



export const welcome = new GraphQLNonNull(GraphQLString)
export const allUsers = new GraphQLList(GraphQLOneUserResponse);
export const search = GraphQlUniformResponse({
    name: "searchUser",
    data: new GraphQLNonNull(GraphQLOneUserResponse),
})

export const addFollower = new GraphQLList(GraphQLOneUserResponse)
