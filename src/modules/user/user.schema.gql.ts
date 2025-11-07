import { UserResolver } from "./user.resolver";
 import * as gqlTypes from "./user.types.gql"
 import * as gqlArgs from "./user.args"
import { GraphQLNonNull, GraphQLString } from "graphql";



class userGQLSchema {
    private userResolver: UserResolver = new  UserResolver();

    constructor() {}
    
    registerQuery = () => {
        return {
            sayHi:{
                type: gqlTypes.welcome,
                args:{name:{type:new GraphQLNonNull(GraphQLString)}},
                description: "this field return our server welcome message",
                resolve: this.userResolver.welcome,
            },

            allUsers: {
                type: gqlTypes.allUsers,
                args: gqlArgs.allUsers,
                resolve: this.userResolver.allUsers,
            },
            searchUser: {
                type: gqlTypes.search,
                args: gqlArgs.search,
                resolve: this.userResolver.search,
            },
        }
    }
    registerMutation = () => {
        return {
            addFollower: {
                type: gqlTypes.addFollower,
                args: gqlArgs.addFollower,
                resolve: this.userResolver.addFollower,
            },
        }
    }
}

export default new userGQLSchema();