import {z} from 'zod';
import { generalFields } from '../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';

export const getChat = {
    params: z.strictObject({
        userId: generalFields.id,
    }),

    query: z.strictObject({
        page: z.coerce.number().int().min(1).optional(),
        size: z.coerce.number().int().min(1).optional(),
    }),
}

export const getChattingGroup = {
    params: z.strictObject({
    groupId: generalFields.id,
    }),

    query:getChat.query
}

export const sendMessageSchema = z.strictObject({
    content: z.string().min(1, "Message cannot be empty").max(5000),
    sendTo: z.string().length(24, "Invalid user ID"),
});

export const sendGroupMessageSchema = z.strictObject({
    content: z.string().min(1, "Message cannot be empty").max(5000),
    groupId: z.string().length(24, "Invalid group ID"),
});

export const createChattingGroup = {
    body: z.strictObject({
        participants: z.array(generalFields.id).min(1),
        group: z.string().min(2).max(5000),
        attachment:generalFields.file(fileValidation.image)
    })
    .superRefine((data, ctx) =>{
    if (data.participants?.length && data.participants.length !== [...new Set(data.participants)].length) {
    ctx.addIssue({
        code: "custom",
        path: ["participants"],
        message: "Duplicate tags are not allowed",
    });
}
    })
}