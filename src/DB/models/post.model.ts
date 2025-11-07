import { model, Schema, models, Document, Types } from "mongoose";

export enum AllowCommentsEnum {
  allow = "allow",
  deny = "deny",
}

export enum AvailabilityEnum {
  public = "public",
  friends = "friends",
  onlyMe = "onlyMe",
}
export enum LikeActionEnum{
  like = "like",
  unlike = "unlike"
}

export enum PostStatusEnum {
  ACTIVE = "active",
  FREEZED = "freezed",
  DELETED = "deleted"
}

export interface IPost {
  content: string;
  attachments?: string[];
  allowComments?: AllowCommentsEnum;
  availability?: AvailabilityEnum;
  assetsFolderId?: string[]; 
  tags?: Types.ObjectId[];
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  shares: Types.ObjectId[];
  createdBy: Types.ObjectId;
  freezedBy?: Types.ObjectId;
  freezedAt?: Date;
  freezeReason?: string;
  restoredBy?: Types.ObjectId;
  restoredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status: PostStatusEnum;
}

export type HPostDocument = IPost & Document;

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 500000,
      required: function () {
        return !(this as IPost).attachments?.length;
      },
    },

    attachments: [String],
    allowComments: {
      type: String,
      enum: Object.values(AllowCommentsEnum),
      default: AllowCommentsEnum.allow,
    },
    availability: {
      type: String,
      enum: Object.values(AvailabilityEnum),
      default: AvailabilityEnum.public,
    },
    assetsFolderId: [String],

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    shares: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    freezedAt: Date,
     freezeReason: { type: String },

    restoredAt: Date,
        status: {
      type: String,
      enum: Object.values(PostStatusEnum),
      default: PostStatusEnum.ACTIVE
    },
    
  },
  { 
    timestamps: true,
    strictQuery: true,
  }
);

postSchema.pre(["find","findOne"], function(next){
   const query = this.getQuery();
   if (query.paranoid === false) {
    this.setQuery({ ...query, deletedAt: { $exists: true } });
   }
   next();
})

postSchema.pre(["findOneAndUpdate","updateOne"], function(next){
   const query = this.getQuery();
   if (query.paranoid === false) {
    this.setQuery({ ...query, deletedAt: { $exists: true } });
   }
   next();
})
export const PostModel = models.Post || model<IPost>("Post", postSchema);
