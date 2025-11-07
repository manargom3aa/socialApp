"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const post_service_1 = require("./post.service");
class PostResolver {
    postService = new post_service_1.PostService();
    constructor() { }
    allPosts = async (parent, args, context) => {
        return await this.postService.allPosts(args, context.user);
    };
    likePost = async (parent, args, context) => {
        return await this.postService.likeGraphPost(args, context.user);
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
        const { reason } = req.body;
        const post = await this.postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id },
        });
        if (!post)
            throw new NotFoundException("Post not found");
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
exports.PostResolver = PostResolver;
