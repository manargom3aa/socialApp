import z from "zod";
import { LogoutEnum } from "../../utils/security/token.security";
import { Types } from "mongoose";
import { generalFields } from "../../middleware/validation.middleware";
import { GenderEnum, RoleEnum } from "../../DB/models";


export const logout = {
    body:z.strictObject({
        flag:z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}

export const sendFriendRequest = {
    params: z.strictObject({
        userId: generalFields.id
    }),
}

export const acceptFriendRequest = {
    params: z.strictObject({
        requestId: generalFields.id
    }),
}

export const changeRole = {
    params: sendFriendRequest.params,
    body:z.strictObject({
        role: z.enum(RoleEnum),
    })
}

export const freezeAccount = {
    params:z.object({
        userId:z.string().optional(),
    })
    .optional()
    .refine((data) => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true;
    },
    {
        error: "invalid object format",
        path: ["userId"],
    }
)
}

export const updateBasicInfo = {
    body: z.strictObject({
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        userName: z.string().min(3).max(30).optional(),
        gender: z.enum(GenderEnum).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
        dateOfBirth: z.string().datetime().optional(),  
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    })
}

export const updateEmail = {
    body: z.strictObject({
        newEmail: generalFields.email,
        password: generalFields.password,
    })
}
export const confirmEmailUpdate = {
    body: z.strictObject({
        otp: generalFields.otp,
    })
}

export const enable2FA = {
    body: z.strictObject({
        password: generalFields.password,
    })
}

export const disable2FA = {
    body: z.strictObject({
        password: generalFields.password,
    })
}

export const verify2FA = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp,
    })
}

export const send2FACode = {
    body: z.strictObject({
        email: generalFields.email,
    })
}

export const restoreAccount = {
    params:z.object({
        userId:z.string(),
    })
 
    .refine((data) => {
        return Types.ObjectId.isValid(data.userId);
    },
    {
        error: "invalid object format",
        path: ["userId"],
    }
)
}

export const blockUser = {
  params: z.strictObject({
    userId: generalFields.id
  }),
  body: z.strictObject({
    reason: z.string().min(5).max(500).optional()
  })
}

export const hardDelete = restoreAccount