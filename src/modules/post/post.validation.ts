import {z} from "zod";
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from "../../DB/models/post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public).optional(),
        tags: z.array(generalFields.id).max(10).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
    }).superRefine((data,ctx)=>{
        if(!data.content && (!data.attachments || data.attachments.length === 0)){
            ctx.addIssue({
                code:"custom",
                path: ['content'],
                message: "Either content or attachments is required"
            })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
              code: "custom",
              path: ["tags"],
              message: "Duplicate tags are not allowed",
            });
        }
})
}

export const getPostById = {
  params: z.strictObject({
    postId: generalFields.id
  })
}




export const updatePost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  body: z.strictObject({
    content: z.string().min(2).max(500000).optional(),
    allowComments: z.enum(AllowCommentsEnum).optional(),
    availability: z.enum(AvailabilityEnum).optional(),
    tags: z.array(generalFields.id).max(10).optional(),
    removed_tags: z.array(generalFields.id).max(10).optional(),

    attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
    removed_attachments: z.array(z.string().url().or(z.string())).max(10).optional(),
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

    if (
      data.removed_attachments?.length &&
      data.removed_attachments.length !== [...new Set(data.removed_attachments)].length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["removed_attachments"],
        message: "Duplicate attachments are not allowed",
      });
    }
  }),
};


export const freezePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    body: z.strictObject({
        reason: z.string().min(5).max(500).optional()
    })
}

export const restorePost = {
    params: z.strictObject({
        postId: generalFields.id
    })
}

export const hardDeletePost = {
    params: z.strictObject({
        postId: generalFields.id
    })
}

export const likePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like).optional()
    }),
}