"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = exports.postAvailability = void 0;
const post_repository_1 = require("../../DB/repository/post.repository");
const post_model_1 = require("../../DB/models/post.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const response_1 = require("../../utils/response");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const gateway_1 = require("../gateway");
const graphql_1 = require("graphql");
const postAvailability = (user) => {
    return [
        { availability: post_model_1.AvailabilityEnum.public },
        { availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: user._id },
        {
            availability: post_model_1.AvailabilityEnum.friends,
            createdBy: { $in: [...(user.friends || []), user._id] },
        },
        {
            availability: { $ne: post_model_1.AvailabilityEnum.onlyMe },
            tags: { $in: [user._id] },
        },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    createPost = async (req, res) => {
        const taggedUsers = await this.userModel.find({
            filter: { _id: { $in: req.body.tags || [] } },
        });
        if (taggedUsers.length !== (req.body.tags?.length || 0)) {
            throw new error_response_1.NotFoundException("Some of the mentioned users do not exist");
        }
        let attachments = [];
        const assetsFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/posts/${assetsFolderId}`,
            });
        }
        const [post] = (await this.postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetsFolderId: attachments.length ? assetsFolderId : null,
                    createdBy: req.user?._id,
                },
            ],
        })) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequest("Fail to generate this post");
        }
        return (0, response_1.successResponse)({
            res,
            status: 201,
            data: post,
            message: "Post created successfully",
        });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
            },
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Fail to find matching result");
        }
        if (req.body.removed_attachments?.length && post.attachments?.length) {
            post.attachments = post.attachments.filter((attachment) => !req.body.removed_attachments.includes(attachment));
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of the mentioned users do not exist");
        }
        let newAttachments = [];
        if (req.files?.length) {
            newAttachments = await (0, s3_config_1.uploadFiles)({
                storageApproach: cloud_multer_1.StorageEnum.memory,
                files: req.files,
                path: `users/${req.user?._id}/posts/${post.assetsFolderId}`,
            });
            post.attachments = [...(post.attachments || []), ...newAttachments];
        }
        const removedAttachments = req.body.removed_attachments || [];
        const finalAttachments = [
            ...new Set([
                ...(post.attachments || []).filter((a) => !removedAttachments.includes(a)),
                ...newAttachments,
            ]),
        ];
        const removedTags = (req.body.removed_tags || []).map(String);
        const finalTags = [
            ...new Set([
                ...(post.tags || []).filter((t) => !removedTags.includes(t?.toString?.())),
                ...(req.body.tags || []),
            ]),
        ];
        const updatedPost = await this.postModel.updateOne({
            filter: { _id: post._id },
            update: {
                $set: {
                    content: req.body.content ?? post.content,
                    allowComments: req.body.allowComments ?? post.allowComments,
                    availability: req.body.availability ?? post.availability,
                    attachments: finalAttachments,
                    tags: finalTags,
                },
            },
        });
        if (!updatedPost.matchedCount) {
            if (newAttachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: newAttachments });
            }
            throw new error_response_1.BadRequest("Fail to update this post");
        }
        if (removedAttachments.length) {
            await (0, s3_config_1.deleteFiles)({ urls: removedAttachments });
        }
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message: "Post updated successfully",
        });
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
        const { reason } = req.body;
        const post = await this.postModel.findOne({ filter: { _id: postId, createdBy: req.user?._id } });
        if (!post)
            throw new error_response_1.NotFoundException("Post not found");
        await this.postModel.updateOne({
            filter: { _id: postId },
            update: {
                $set: { freezedAt: new Date(), freezeReason: reason || null },
            },
        });
        return (0, response_1.successResponse)({ res, status: 200, message: "Post frozen successfully" });
    };
    hardDeletePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({ filter: { _id: postId } });
        if (!post)
            throw new error_response_1.NotFoundException("Post not found");
        if (post.attachments?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: post.attachments });
        }
        await this.postModel.deleteOne({ filter: { _id: postId } });
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message: "Post deleted permanently",
        });
    };
    getPostById = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({ filter: { _id: postId } });
        if (!post)
            throw new error_response_1.NotFoundException("Post not found");
        return (0, response_1.successResponse)({ res, status: 200, data: post });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === post_model_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                paranoid: false,
                $or: (0, exports.postAvailability)(req.user),
            },
            update,
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post not found");
        }
        if (action !== post_model_1.LikeActionEnum.unlike) {
            const targets = gateway_1.connectedSockets.get(post.createdBy.toString());
            if (targets) {
                if (Array.isArray(targets)) {
                    for (const t of targets) {
                        (0, gateway_1.getIo)().to(t).emit("likePost", { postId, userId: req.user?._id });
                    }
                }
                else {
                    (0, gateway_1.getIo)().to(targets).emit("likePost", { postId, userId: req.user?._id });
                }
            }
        }
        const message = action === post_model_1.LikeActionEnum.unlike
            ? "Post unliked successfully"
            : "Post liked successfully";
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message,
            data: post,
        });
    };
    postList = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this.postModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(req.user),
            },
            options: {
                populate: [
                    {
                        path: "comments",
                        match: {
                            commentId: { $exists: false },
                            freezedAt: { $exists: false },
                        },
                        populate: [
                            {
                                path: "reply",
                                match: {
                                    freezedAt: { $exists: false },
                                },
                                populate: [
                                    {
                                        path: "reply",
                                        match: {
                                            freezedAt: { $exists: false },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            page,
            size,
        });
        return (0, response_1.successResponse)({ res, data: { posts } });
    };
    allPosts = async ({ page, size }, authUser) => {
        const posts = await this.postModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(authUser),
            },
            options: {
                populate: [
                    {
                        path: "comments",
                        match: {
                            commentId: { $exists: false },
                            freezedAt: { $exists: false },
                        },
                        populate: [
                            {
                                path: "reply",
                                match: {
                                    freezedAt: { $exists: false },
                                },
                                populate: [
                                    {
                                        path: "reply",
                                        match: {
                                            freezedAt: { $exists: false },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            page,
            size,
        });
        return posts.result;
    };
    likeGraphPost = async ({ postId, action }, authUser) => {
        let update = {
            $addToSet: { likes: authUser._id },
        };
        if (action === post_model_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: authUser._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(authUser),
            },
            update,
        });
        if (!post) {
            throw new graphql_1.GraphQLError("Post not found", { extensions: { statusCode: 404 } });
        }
        if (action !== post_model_1.LikeActionEnum.unlike) {
            const targets = gateway_1.connectedSockets.get(post.createdBy.toString());
            if (targets) {
                if (Array.isArray(targets)) {
                    for (const t of targets) {
                        (0, gateway_1.getIo)().to(t).emit("likePost", { postId, userId: authUser._id });
                    }
                }
                else {
                    (0, gateway_1.getIo)().to(targets).emit("likePost", { postId, userId: authUser._id });
                }
            }
        }
        return post;
    };
}
exports.PostService = PostService;
exports.postService = new PostService();
