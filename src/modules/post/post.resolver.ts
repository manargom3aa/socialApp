import { HPostDocument, LikeActionEnum } from "../../DB/models";
import { IAuthGraph } from "../graphql/schema.interface.gql";
import { PostService } from "./post.service";


export class PostResolver {
    private postService: PostService = new PostService();
    constructor() {}

    allPosts = async(parent:unknown, args:{ page: number, size: number }, context:IAuthGraph):Promise<HPostDocument[]> =>{
        return await this.postService.allPosts(args, context.user)
    }

    
    likePost = async(parent:unknown, args:{  postId: string; action:LikeActionEnum }, context:IAuthGraph):Promise<HPostDocument[]> =>{
        return await this.postService.likeGraphPost(args, context.user)
    }


    freezePost = async (req: Request, res: Response): Promise<Response> => {
  const { postId } = req.params;
  const { reason } = req.body;

  const post = await this.postModel.findOne({
    filter: { _id: postId, createdBy: req.user?._id },
  });

  if (!post) throw new NotFoundException("Post not found");

  // لو بالفعل مجمد
  if (post.freezedAt) {
    throw new BadRequest("This post is already frozen");
  }

  await this.postModel.updateOne({
    filter: { _id: postId },
    update: {
      $set: {
        freezedAt: new Date(),
        freezeReason: reason || null,
      },
    },
  });

  return successResponse({
    res,
    status: 200,
    message: "Post frozen successfully",
  });
};

}