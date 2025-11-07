import {z} from "zod";
import { LikeActionEnum } from "../../DB/models/post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const createComment = {
    params: z.strictObject({postId:generalFields.id}),
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        
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


export const replyComment = {
  params:createComment.params.extend({
    commentId: generalFields.id,
  })
};

export const freezeComment = {
  params: z.strictObject({
    postId: generalFields.id,
    commentId: generalFields.id
  }),
  body: z.strictObject({
    reason: z.string().min(5).max(500).optional()
  })
}

export const hardDeleteComment = {
  params: z.strictObject({
    postId: generalFields.id,
    commentId: generalFields.id
  })
}

export const updateComment = {
  params: z.strictObject({
    postId: generalFields.id,
    commentId: generalFields.id
  }),
  body: z.strictObject({
    content: z.string().min(2).max(500000).optional(),
    tags: z.array(generalFields.id).max(10).optional(),
    attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional()
  }).superRefine((data, ctx) => {
    if (!data.content && (!data.attachments || data.attachments.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ['content'],
        message: "Either content or attachments is required"
      })
    }
    if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
      ctx.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Duplicate tags are not allowed",
      })
    }
  })
}


export const getCommentById = {
  params: z.strictObject({
    postId: generalFields.id,
    commentId: generalFields.id
  })
}

export const likeComment = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like).optional()
    }),
}