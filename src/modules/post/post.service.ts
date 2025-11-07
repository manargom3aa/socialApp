import { Request, Response } from "express";
import { PostRepository } from "../../DB/repository/post.repository";
import {
  AvailabilityEnum,
  HPostDocument,
  LikeActionEnum,
  PostModel,
} from "../../DB/models/post.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { HUserDocument, UserModel } from "../../DB/models/user.model";
import { successResponse } from "../../utils/response";
import { BadRequest,  NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles  } from "../../utils/multer/s3.config";
import { v4 as uuidv4 } from "uuid";
import { LikePostQueryDTO } from "./post.dto";
import { UpdateQuery } from "mongoose";
import { Types } from "mongoose";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { connectedSockets, getIo } from "../gateway";
import { GraphQLError } from "graphql";

export const postAvailability = (user:HUserDocument) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy:  user._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...( user.friends || []),  user._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tags: { $in: [ user._id] },
    },
  ];
};

export class PostService {
  private userModel = new UserRepository(UserModel);
  private postModel = new PostRepository(PostModel);

  createPost = async (req: Request, res: Response): Promise<Response> => {
    const taggedUsers = await this.userModel.find({
      filter: { _id: { $in: req.body.tags || [] } },
    });

    if (taggedUsers.length !== (req.body.tags?.length || 0)) {
      throw new NotFoundException("Some of the mentioned users do not exist");
    }

    let attachments: string[] = [];
    const assetsFolderId: string = uuidv4();

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/posts/${assetsFolderId}`,
      });
    }

    const [post] =
      (await this.postModel.create({
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
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequest("Fail to generate this post")
        }
    return successResponse({
      res,
      status: 201,
      data: post,
      message: "Post created successfully",
    });
  };

updatePost = async (req: Request, res: Response): Promise<Response> => {
  const { postId } = req.params as unknown as { postId: Types.ObjectId };

  
  const post = await this.postModel.findOne({
    filter: {
      _id: postId,
      createdBy: req.user?._id,
    },
  });

  if (!post) {
    throw new NotFoundException("Fail to find matching result");
  }

 
  if (req.body.removed_attachments?.length && post.attachments?.length) {
    post.attachments = post.attachments.filter(
      (attachment: string) => !req.body.removed_attachments.includes(attachment)
    );
  }
 
  if (
    req.body.tags?.length &&
    (
      await this.userModel.find({
        filter: { _id: { $in: req.body.tags } },
      })
    ).length !== req.body.tags.length
  ) {
    throw new NotFoundException("Some of the mentioned users do not exist");
  }

 
  let newAttachments: string[] = [];
  if (req.files?.length) {
    newAttachments = await uploadFiles({
      storageApproach: StorageEnum.memory,
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}/posts/${post.assetsFolderId}`,
    });

    post.attachments = [...(post.attachments || []), ...newAttachments];
  }

 
  const removedAttachments: string[] = req.body.removed_attachments || [];
  const finalAttachments = [
    ...new Set([
      ...(post.attachments || []).filter((a) => !removedAttachments.includes(a)),
      ...newAttachments,
    ]),
  ];

  const removedTags = (req.body.removed_tags || []).map(String);
  const finalTags = [
    ...new Set([
      ...(post.tags || []).filter((t: any) => !removedTags.includes(t?.toString?.())),
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
      await deleteFiles({ urls: newAttachments });
    }
    throw new BadRequest("Fail to update this post");
  }

  
  if (removedAttachments.length) {
    await deleteFiles({ urls: removedAttachments });
  }

  return successResponse({
    res,
    status: 200,
    message: "Post updated successfully",
  });
}
freezePost = async (req: Request, res: Response): Promise<Response> => {
  const { postId } = req.params;
  const { reason } = req.body;

  const post = await this.postModel.findOne({ filter: { _id: postId, createdBy: req.user?._id } });
  if (!post) throw new NotFoundException("Post not found");

  await this.postModel.updateOne({
    filter: { _id: postId },
    update: {
      $set: { freezedAt: new Date(), freezeReason: reason || null },
    },
  });

  return successResponse({ res, status: 200, message: "Post frozen successfully" });
};

hardDeletePost = async (req: Request, res: Response): Promise<Response> => {
  const { postId } = req.params;
 
  const post = await this.postModel.findOne({ filter: { _id: postId } });
  if (!post) throw new NotFoundException("Post not found");
 
  if (post.attachments?.length) {
    await deleteFiles({ urls: post.attachments });
  }
 
  await this.postModel.deleteOne({ filter: { _id: postId } });

  return successResponse({
    res,
    status: 200,
    message: "Post deleted permanently",
  });
};

getPostById = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as { postId: string };
    const post = await this.postModel.findOne({ filter: { _id: postId } });

    if (!post) throw new NotFoundException("Post not found");

    return successResponse({ res, status: 200, data: post });
  }



  likePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as { postId: string };
    const { action } = req.query as LikePostQueryDTO;

    let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: req.user?._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = { $pull: { likes: req.user?._id } };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        paranoid: false,
        $or: postAvailability(req.user as HUserDocument),
      },
      update,
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (action !== LikeActionEnum.unlike) {
      const targets = connectedSockets.get(post.createdBy.toString());
      if (targets) {
        if (Array.isArray(targets)) {
          for (const t of targets) {
            getIo().to(t).emit("likePost", { postId, userId: req.user?._id });
          }
        } else {
          getIo().to(targets).emit("likePost", { postId, userId: req.user?._id });
        }
      }
    }
    const message =
      action === LikeActionEnum.unlike
        ? "Post unliked successfully"
        : "Post liked successfully";

    return successResponse({
      res,
      status: 200,
      message,
      data: post,
    });
  };

  
  postList = async (req:Request, res: Response): Promise<Response> => {
 
    let { page, size }= req.query as unknown as { page: number; size: number }
 
const posts = await this.postModel.paginate({
  filter: {
    $or: postAvailability(req.user as HUserDocument),
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

      return successResponse({ res, data:{ posts } });
  }

allPosts = async ({ page, size }:{page:number, size: number} , authUser:HPostDocument ):Promise<HPostDocument[]> => {

const posts = await this.postModel.paginate({
  filter: {
    $or: postAvailability(authUser),
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

      return posts.result
  }


  
  likeGraphPost = async (
    { postId, action }:{ postId: string; action:LikeActionEnum },
    authUser: HUserDocument): Promise<HPostDocument> => {
      let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: authUser._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = { $pull: { likes: authUser._id } };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
     
        $or: postAvailability(authUser),
      },
      update,
    });

    if (!post) {
      throw new GraphQLError("Post not found", {extensions:{statusCode:404}});
    }

    if (action !== LikeActionEnum.unlike) {
      const targets = connectedSockets.get(post.createdBy.toString());
      if (targets) {
        if (Array.isArray(targets)) {
          for (const t of targets) {
            getIo().to(t).emit("likePost", { postId, userId: authUser._id });
          }
        } else {
          getIo().to(targets).emit("likePost", { postId, userId: authUser._id });
        }
      }
    }
 

    return post
}  
}

export const postService = new PostService();
