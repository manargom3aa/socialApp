import { PostResolver } from "./post.resolver";
import * as gqlArgs from './post.args.gpl'
import * as gqlTypes from './post.types.gql'
import { GraphQLList } from "graphql";


class PostGqlSchema {
    private postResolver:PostResolver = new PostResolver()
    constructor(){}

    registerQuery =() =>{
        return {
            allPosts:{
                type: new GraphQLList(gqlTypes.GraphQLOnePostResponse),

                args:gqlArgs.allPosts,
                resolve:this.postResolver.allPosts,
            }
        }
    }
    registerMutation =() =>{
        return {
            likePost:{
                type: gqlTypes.GraphQLOnePostResponse,

                args:gqlArgs.likePost,
                resolve:this.postResolver.likePost,
            }
        }
    }

}

export default new PostGqlSchema()