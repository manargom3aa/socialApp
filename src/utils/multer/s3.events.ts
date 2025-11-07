import { EventEmitter } from "node:events";
import { UserRepository } from "../../DB/repository/user.repository";
import { deleteFile, getFile } from "./s3.config";
import { HUserDocument, UserModel } from "../../DB/models/user.model";
import { UpdateQuery } from "mongoose";

export const s3Events = new EventEmitter();

s3Events.on("s3:profileImageUploaded", (data) => {
  console.log({ data });

  setTimeout(async () => {
    const userModel = new UserRepository(UserModel);

    try {
      await getFile({ Key: data.Key });

      await userModel.updateOne({
        filter: { _id: data.userId },
        update: { $unset: { tempProfileImage: 1 } },
      });

      await deleteFile({ Key: data.oldKey });

      console.log("✅ Done");
    } catch (error: any) {
      console.log(error);

      if (error.Code === "NoSuchKey") {

        console.log({eD:data});
        let unsetData: UpdateQuery<HUserDocument> = { tempProfileImage:1 };
        if (!data.oldKey) {
          unsetData = { tempProfileImage:1, profileImage:1 };
        }

        await userModel.updateOne({
          filter: { _id: data.userId },
          update: {
            $unset: { tempProfileImage: 1 },
            profileImage: data.oldKey,
          },
        });
      }
    }
  }, data.expiresIn || 300000); // 5 minutes
});
