import type { NextFunction, Request, Response } from "express";
import z, { ZodError, ZodType } from "zod";
import { BadRequest } from "../utils/response/error.response";
 
import { Types } from "mongoose";
import { GraphQLError } from "graphql";
 
 

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;

type ValidationErrorsType = Array<{
  key: KeyReqType;
  issues: Array<{
    message: string;
    path: (string | number | symbol | undefined)[];
  }>;
}>;

/*
  // input 
  @param schema : SchemaType


  //output
  if no errors then return next() otherwise throw BadRequest ( validationErrors)
*/

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: ValidationErrorsType = [];

    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;
      if(req.file){
        req.body.attachment = req.file;
      }
        if(req.files){
        req.body.attachments = req.files;
      }

      const validationResult = schema[key]!.safeParse(req[key]);

      if (!validationResult.success) {
        const errors = validationResult.error as ZodError;
        validationErrors.push({
          key,
          issues: errors.issues.map((issue) => {
            return { path: issue.path, message: issue.message };
          }),
        });
      }
    }

    if (validationErrors.length) {
      throw new BadRequest("Validation Error", {
        validationErrors,
      });
    }

    next();
  };
};



export const graphValidation = async<T=any> (schema: ZodType, args:T) => {
  const validationResult = await schema.safeParseAsync(args);
  if (!validationResult.success) {
    const ZodError = validationResult.error as ZodError;
    throw new GraphQLError("validation Error", {
      extensions:{
        statusCode:400,
        issues: {
          key: "args",
          issues: ZodError.issues.map((issue) => {
            return { path: issue.path,message: issue.message }
          }),
        },
      },
    })
  }
};


export const generalFields = {
  username: z.string().min(2).max(20),
  email: z.string().email({
    message: "Valid email must be like example@domain.com",
  }),
  password: z
    .string()
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
      "Password must be at least 8 characters, include uppercase, lowercase, and a number"
    ),
  confirmPassword: z.string(),
  otp: z
    .string()
    .length(6)
    .regex(/^[0-9]{6}$/, "OTP must contain only numbers"),
  file: function (mimetype: string[]) {
    return z.strictObject({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.enum(mimetype),
      size: z.number().max(5 * 1024 * 1024, "File size should not exceed 5MB"),
      path: z.string().optional(),
      buffer: z.any().optional(),
      filename: z.string().optional(),
    }).refine(
      (data) => data.buffer || data.path,
      { message: "neither buffer nor path is provided", path: ['file'] }
    );
  },
  id: z.string().refine(
    (data) => Types.ObjectId.isValid(data),
    { message: "invalid object format", path: ['id'] }
  )
};
