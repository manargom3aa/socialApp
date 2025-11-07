import { model, Schema, models, Document, Types } from "mongoose";

export interface IFriendRequest {
  sendTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  acceptedAt?: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FriendRequestDocument = IFriendRequest & Document;

const friendRequestSchema = new Schema<FriendRequestDocument>(
  {
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, strictQuery: true }
);

// Soft-delete filter
friendRequestSchema.pre(["find", "findOne"], function (next) {
  const query = this.getQuery();

  if (query.paranoid === false) {
    delete query.paranoid;
  } else {
    this.setQuery({ ...query, deletedAt: { $eq: null } });
  }

  next();
});

friendRequestSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const query = this.getQuery();

  if (query.paranoid === false) {
    delete query.paranoid;
  } else {
    this.setQuery({ ...query, deletedAt: { $eq: null } });
  }

  next();
});

export const FriendRequestModel =
  models.FriendRequest || model<FriendRequestDocument>("FriendRequest", friendRequestSchema);
