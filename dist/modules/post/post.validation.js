"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.hardDeletePost = exports.restorePost = exports.freezePost = exports.updatePost = exports.getPostById = exports.createPost = void 0;
const zod_1 = require("zod");
const post_model_1 = require("../../DB/models/post.model");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createPost = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        allowComments: zod_1.z.enum(post_model_1.AllowCommentsEnum).default(post_model_1.AllowCommentsEnum.allow).optional(),
        availability: zod_1.z.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.public).optional(),
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
exports.getPostById = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
};
exports.updatePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        allowComments: zod_1.z.enum(post_model_1.AllowCommentsEnum).optional(),
        availability: zod_1.z.enum(post_model_1.AvailabilityEnum).optional(),
        tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(10).optional(),
        removed_tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(10).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(2).optional(),
        removed_attachments: zod_1.z.array(zod_1.z.string().url().or(zod_1.z.string())).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!Object.values(data)?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "all fields are empty",
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicate tags are not allowed",
            });
        }
        if (data.removed_attachments?.length &&
            data.removed_attachments.length !== [...new Set(data.removed_attachments)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["removed_attachments"],
                message: "Duplicate attachments are not allowed",
            });
        }
    }),
};
exports.freezePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    body: zod_1.z.strictObject({
        reason: zod_1.z.string().min(5).max(500).optional()
    })
};
exports.restorePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
};
exports.hardDeletePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
};
exports.likePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    query: zod_1.z.strictObject({
        action: zod_1.z.enum(post_model_1.LikeActionEnum).default(post_model_1.LikeActionEnum.like).optional()
    }),
};
