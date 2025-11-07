"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../../utils/response");
const repository_1 = require("../../DB/repository");
const models_1 = require("../../DB/models");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const post_1 = require("../post");
class CommentService {
    userModel = new repository_1.UserRepository(models_1.UserModel);
    postModel = new repository_1.PostRepository(models_1.PostModel);
    commentModel = new repository_1.CommentRepository(models_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: models_1.AllowCommentsEnum.allow,
                $or: (0, post_1.postAvailability)(req.user)
            },
        });
        if (!post) {
            throw new error_response_1.NotFoundException("fail to find matching result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of mentioned account are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [comment] = (await this.commentModel.create({
            data: [
                {
                    ...req.body,
                    postId,
                    commentId,
                    attachments,
                    createdBy: req.user?._id,
                },
            ],
        })) || [];
        if (!comment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequest("Fail to generate this comment");
        }
        return (0, response_1.successResponse)({
            res,
            status: 201,
            data: comment,
            message: "Comment created successfully",
        });
    };
    replyOnComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            allowComments: models_1.AllowCommentsEnum.allow,
                            $or: (0, post_1.postAvailability)(req.user)
                        }
                    }
                ]
            }
        });
        if (!comment?.postId) {
            throw new error_response_1.NotFoundException("fail to find matching result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of mentioned account are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [reply] = (await this.commentModel.create({
            data: [
                {
                    ...req.body,
                    postId,
                    commentId,
                    attachments,
                    createdBy: req.user?._id,
                },
            ],
        })) || [];
        if (!reply) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequest("Fail to generate this comment");
        }
        return (0, response_1.successResponse)({
            res,
            status: 201,
            data: comment,
            message: "Comment created successfully",
        });
    };
    updateComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: { _id: commentId, postId }
        });
        if (!comment)
            throw new error_response_1.NotFoundException("Comment not found");
        let attachments = [];
        if (req.files?.length) {
            const post = await this.postModel.findOne({ filter: { _id: postId } });
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post?.createdBy}/post/${post?.assetsFolderId}`,
            });
        }
        const updatedComment = await this.commentModel.updateOne({
            filter: { _id: commentId },
            update: {
                $set: {
                    ...req.body,
                    attachments: attachments.length ? attachments : comment.attachments
                }
            }
        });
        if (!updatedComment.matchedCount)
            throw new error_response_1.NotFoundException("Failed to update comment");
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message: "Comment updated successfully",
        });
    };
    getCommentById = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({ filter: { _id: commentId } });
        if (!comment)
            throw new error_response_1.NotFoundException("Comment not found");
        return (0, response_1.successResponse)({ res, status: 200, data: comment });
    };
    freezeComment = async (req, res) => {
        console.log(req.params, req.body);
        const { commentId } = req.params;
        const comment = await this.commentModel.updateOne({
            filter: { _id: commentId },
            update: {
                $set: {
                    freezedAt: new Date(),
                    freezedBy: req.user?._id,
                    freezeReason: req.body.reason,
                },
            },
        });
        if (!comment.matchedCount) {
            throw new error_response_1.NotFoundException("Comment not found");
        }
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message: "Comment freezed successfully",
        });
    };
    hardDeleteComment = async (req, res) => {
        const { commentId } = req.params;
        const result = await this.commentModel.deleteOne({
            filter: { _id: commentId },
        });
        if (!result.deletedCount) {
            throw new error_response_1.NotFoundException("Comment not found");
        }
        return (0, response_1.successResponse)({
            res,
            status: 200,
            message: "Comment deleted permanently",
        });
    };
}
exports.default = new CommentService();
