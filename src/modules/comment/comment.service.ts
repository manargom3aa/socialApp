import type { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/repository";
import { AllowCommentsEnum, CommentModel, HPostDocument, HUserDocument, PostModel, UserModel } from "../../DB/models";
import { BadRequest, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { Types } from "mongoose";
import { postAvailability } from "../post";



class CommentService {
    private userModel = new UserRepository(UserModel)
    private postModel = new PostRepository(PostModel)
    private commentModel = new CommentRepository(CommentModel)
    constructor() {}
   
   
    createComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId; commentId?: Types.ObjectId }
    const post = await this.postModel.findOne({
        filter: {
            _id: postId,
            allowComments: AllowCommentsEnum.allow,
            $or: postAvailability(req.user as HUserDocument)
        },
    })
    if (!post) {
        throw new NotFoundException("fail to find matching result")
    }
    if (
        req.body.tags?.length && 
        (
            await this.userModel.find
            ({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })
        ).length !== req.body.tags.length

    ) {
        throw new NotFoundException("some of mentioned account are not exist")
    }
 
    let attachments: string[] = [];
    

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      });
    }

    const [comment] =
      (await this.commentModel.create({
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
            await deleteFiles({ urls: attachments });
        }
        throw new BadRequest("Fail to generate this comment")
    }
    return successResponse({
      res,
      status: 201,
      data: comment,
      message: "Comment created successfully",
    });
  };


    replyOnComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {postId: Types.ObjectId ; commentId: Types.ObjectId}
    const comment = await this.commentModel.findOne({
        filter: {
            _id: commentId,
            postId,
        },
        options:{
            populate:[
                {
                    path: "postId",
                    match:{
                        allowComments: AllowCommentsEnum.allow,
                        $or: postAvailability(req.user as HUserDocument)
                    }
                }
            ]
        }
    })
    if (!comment?.postId) {
        throw new NotFoundException("fail to find matching result")
    }
    if (
        req.body.tags?.length && 
        (
            await this.userModel.find
            ({
                filter: { _id: { $in: req.body.tags, $ne: req.user?._id } },
            })
        ).length !== req.body.tags.length

    ) {
        throw new NotFoundException("some of mentioned account are not exist")
    }
 
    let attachments: string[] = [];
    

    if (req.files?.length) {
        const post = comment.postId as Partial<HPostDocument>
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      });
    }

    const [reply] =
      (await this.commentModel.create({
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
            await deleteFiles({ urls: attachments });
        }
        throw new BadRequest("Fail to generate this comment")
    }
    return successResponse({
      res,
      status: 201,
      data: comment,
      message: "Comment created successfully",
    });
  };

updateComment = async (req: Request, res: Response): Promise<Response> => {
  const { postId, commentId } = req.params as { postId: string, commentId: string };

 
  const comment = await this.commentModel.findOne({
    filter: { _id: commentId, postId }
  });

  if (!comment) throw new NotFoundException("Comment not found");

  let attachments: string[] = [];

  if (req.files?.length) {
    const post = await this.postModel.findOne({ filter: { _id: postId } });
    attachments = await uploadFiles({
      files: req.files as Express.Multer.File[],
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

  if (!updatedComment.matchedCount) throw new NotFoundException("Failed to update comment");

  return successResponse({
    res,
    status: 200,
    message: "Comment updated successfully",
  });
}

  getCommentById = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as { commentId: string };
    const comment = await this.commentModel.findOne({ filter: { _id: commentId } });

    if (!comment) throw new NotFoundException("Comment not found");

    return successResponse({ res, status: 200, data: comment });
  }

   freezeComment = async (req: Request, res: Response): Promise<Response> => {
    console.log(req.params, req.body)
    const { commentId } = req.params as { commentId: string };
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
      throw new NotFoundException("Comment not found");
    }

    return successResponse({
      res,
      status: 200,
      message: "Comment freezed successfully",
    });
  };

   
  hardDeleteComment = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as { commentId: string };
    const result = await this.commentModel.deleteOne({
      filter: { _id: commentId },
    });

    if (!result.deletedCount) {
      throw new NotFoundException("Comment not found");
    }

    return successResponse({
      res,
      status: 200,
      message: "Comment deleted permanently",
    });
  };

}

export default new CommentService()