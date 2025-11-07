import { v4 as uuidv4 } from "uuid";
import multer, { FileFilterCallback } from "multer";
import os from "node:os";
import { Request } from "express";
import { BadRequest } from "../response/error.response";
 


export enum StorageEnum {
  memory = "memory",
  disk = "disk",
}

export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
};

export const cloudFileUpload = ({
  validation = [],
  storageApproach = StorageEnum.memory,
  maxSizeMB= 2,
}: {
  validation?: string[];
  storageApproach?: StorageEnum;
  maxSizeMB?: number;
}): multer.Multer => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: function (req: Request, file: Express.Multer.File, callback) {
            callback(null, `${uuidv4()}_${file.originalname}`);
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) {
    if (!validation.includes(file.mimetype)) {
      return callback(
        new BadRequest("Validation error", {
          validationErrors: [
            {
              key: "file",
              issue: [{ path: "file", message:"invalid file format"}],
            },
          ],
        }),

      );
    }

    return callback(null, true);

  }

  return multer({  storage, limits:{fieldSize:maxSizeMB * 1024*1024} ,fileFilter });
};
