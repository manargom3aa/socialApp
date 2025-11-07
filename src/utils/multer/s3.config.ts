import { v4 as uuidv4 } from "uuid";
import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ObjectCannedACL,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageEnum } from "./cloud.multer";
import { createReadStream } from "fs";
import { BadRequest } from "../response/error.response";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export const s3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};

// ✅ upload file
export const uploadFile = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "general",
  file,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const Key = `${process.env.APPLICATION_NAME}/${path}/${uuidv4()}_${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key,
    Body:
      storageApproach === StorageEnum.memory
        ? file.buffer
        : createReadStream(file.path),
    ContentType: file.mimetype,
  });

  await s3Client().send(command);
  if (!command.input.Key) {
    throw new BadRequest("Fail to upload file to s3");
  }
  return command.input.Key;
};

// ✅ upload multiple files
export const uploadFiles = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "general",
  files,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
}): Promise<string[]> => {
  const urls = await Promise.all(
    files.map(async (file) => uploadFile({ storageApproach, Bucket, ACL, path, file }))
  );
  return urls;
};

// ✅ upload large files
export const uploadLargeFile = async ({
  storageApproach = StorageEnum.disk,
  Bucket = process.env.AWS_BUCKET_NAME,
  ACL = "private",
  path = "general",
  file,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const upload = new Upload({
    client: s3Client(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${uuidv4()}_${file.originalname}`,
      Body:
        storageApproach === StorageEnum.memory
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
    partSize: 2 * 1024 * 1024,
  });

  upload.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });

  const { Key } = await upload.done();
  if (!Key) throw new BadRequest("Fail to upload file to s3");
  return Key;
};

// ✅ pre-signed upload link
export const createPreSignedUploadLink = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path = "general",
  expiresIn = 3600,
  ContentType,
  originalname,
}: {
  Bucket?: string;
  path?: string;
  expiresIn?: number;
  ContentType: string;
  originalname: string;
}): Promise<{ url: string; key: string }> => {
  const command = new PutObjectCommand({
    Bucket,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuidv4()}_${originalname}`,
    ContentType,
  });

  const url = await getSignedUrl(s3Client(), command, { expiresIn });
  if (!command.input.Key || !url)
    throw new BadRequest("Fail to create preSigned url");

  return { url, key: command.input.Key };
};

// ✅ pre-signed GET link
export const createGetPreSignedLink = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
  expiresIn = 3600,
  downloadName = "dummy",
  download = "false",
}: {
  Bucket?: string;
  Key: string;
  expiresIn?: number;
  downloadName?: string;
  download?: string;
}): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition:
      download === "true"
        ? `attachment; filename=${Key.split("/").pop() || downloadName}`
        : undefined,
  });

  const url = await getSignedUrl(s3Client(), command, { expiresIn });
  if (!url) throw new BadRequest("Fail to create preSigned url");
  return url;
};

// ✅ get file
export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({ Bucket, Key });
  return await s3Client().send(command);
};

// ✅ delete one file
export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<DeleteObjectCommandOutput> => {
  const command = new DeleteObjectCommand({ Bucket, Key });
  return await s3Client().send(command);
};

// ✅ delete multiple files
export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const Objects = urls.map((url) => ({ Key: url }));

  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: { Objects, Quiet },
  });

  return await s3Client().send(command);
};

// ✅ list files in folder
export const listDirectoryFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}/`,
  });
  return await s3Client().send(command);
};

// ✅ delete folder by prefix
export const deleteFolderByPrefix = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
  Quiet = false,
}: {
  Bucket?: string;
  path: string;
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const fileList = await listDirectoryFiles({ Bucket, path });

  if (!fileList?.Contents?.length)
    throw new BadRequest("No files found in this directory");

  const urls = fileList.Contents.map((file) => file.Key!) as string[];
  return await deleteFiles({ urls, Bucket, Quiet });
};
