import { model, Schema, models, Document, Types } from "mongoose";
import { IPost } from "./post.model";

export interface IComment {
  content: string;
  attachments?: string[];
 
  tags?: Types.ObjectId[];
  likes: Types.ObjectId[];
  postId: Types.ObjectId | Partial<IPost>;
  commentId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  freezedBy?: Types.ObjectId;
  freezedAt?: Date;
  restoredBy?: Types.ObjectId;
  restoredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type HCommentDocument = IComment & Document;

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 500000,
      required: function () {
        return !(this as IComment).attachments?.length;
      },
    },

    attachments: [String],
 
      likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentId: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
   
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    freezedAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
  },
  { 
    timestamps: true,
    strictQuery: true,
  }
);

commentSchema.pre(["find","findOne"], function(next){
   const query = this.getQuery();
   if (query.paranoid === false) {
    this.setQuery({ ...query, deletedAt: { $exists: true } });
   }
   next();
})

commentSchema.pre(["findOneAndUpdate","updateOne"], function(next){
   const query = this.getQuery();
   if (query.paranoid === false) {
    this.setQuery({ ...query, deletedAt: { $exists: true } });
   }
   next();
})
export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);
