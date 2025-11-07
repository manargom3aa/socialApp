"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeComment = exports.getCommentById = exports.updateComment = exports.hardDeleteComment = exports.freezeComment = exports.replyComment = exports.createComment = void 0;
const zod_1 = require("zod");
const post_model_1 = require("../../DB/models/post.model");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createComment = {
    params: zod_1.z.strictObject({ postId: validation_middleware_1.generalFields.id }),
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(10).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(2).optional(),
    }).superRefine((data, ctx) => {
        if (!data.content && (!data.attachments || data.attachments.length === 0)) {
            ctx.addIssue({
                code: "custom",
                path: ['content'],
                message: "Either content or attachments is required"
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicate tags are not allowed",
            });
        }
    })
};
exports.replyComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    })
};
exports.freezeComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    }),
    body: zod_1.z.strictObject({
        reason: zod_1.z.string().min(5).max(500).optional()
    })
};
exports.hardDeleteComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    })
};
exports.updateComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    }),
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(10).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(2).optional()
    }).superRefine((data, ctx) => {
        if (!data.content && (!data.attachments || data.attachments.length === 0)) {
            ctx.addIssue({
                code: "custom",
                path: ['content'],
                message: "Either content or attachments is required"
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicate tags are not allowed",
            });
        }
    })
};
exports.getCommentById = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    })
};
exports.likeComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    query: zod_1.z.strictObject({
        action: zod_1.z.enum(post_model_1.LikeActionEnum).default(post_model_1.LikeActionEnum.like).optional()
    }),
};
