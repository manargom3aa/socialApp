
 
import * as dotenv from 'dotenv'

// config({ path: resolve("./config/.env.development") });
dotenv.config({ })
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
 
import {authRouter,userRouter,postRouter, initializeIo } from './modules'
import { BadRequest, globalErrorHandling } from "./utils/response/error.response";
import connectDB from "./DB/connection.db";   
import { createGetPreSignedLink, getFile } from "./utils/multer/s3.config";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { chatRouter } from "./modules/chat";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "./modules/graphql/schema.gql";
import { authentication } from "./middleware/authentication.middleware";

const createS3StreamPipe = promisify(pipeline);

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 2000,                // أقصى عدد طلبات
  message: { error: "Too many requests, please try again later" },
  statusCode: 429,
});



const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  const port: number | string = process.env.PORT || 5000;

  // ------------------------------------
  app.use(cors());
  app.use(express.json());
  app.use(helmet());
  app.use(limiter);

  // ------------------ Connect DB ------------------
  await connectDB();


app.all("/graphql", authentication(), createHandler({ 
  schema: schema,
  context:(req) => ({ user: req.raw.user }),
}));

  // ------------------ Routes ------------------
  app.get("/", (req: Request, res: Response) => {
    res.json({
      message: `Welcome to ${process.env.APPLICATION_NAME} backend landing page 🚀`,
    });
  });

  //-------------------modules--------------------
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/chat", chatRouter);

 

  app.get("/upload/*path", async (req: Request, res: Response) : Promise<void> => {
    const { downloadName } : { downloadName?: string } = req.query as unknown as { downloadName?: string };
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const s3Response = await getFile({ Key });
    console.log(s3Response.Body);
    if (!s3Response?.Body) {
      throw new BadRequest("failed to fetch file from s3");
    }

    res.set("Cross-Origin-Resource-Policy" , "cross-origin")
    res.setHeader("Content-Type", `${s3Response.ContentType||"application/octet-stream"}`);
    if (downloadName) {
        res.setHeader(
          "Content-Disposition",
           `attachment; filename=${Key.split("/").pop()||downloadName}`);

    }
    return await createS3StreamPipe(s3Response.Body as NodeJS.ReadableStream, res)
  });


    app.get("/upload/pre-signed/*path", async (req: Request, res: Response) : Promise<Response> => {
    const { downloadName , download = "false" }  = req.query as { downloadName?: string , download?: string };
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const url = await createGetPreSignedLink({ Key, downloadName: downloadName as string , download,  });
    return res.json({ message: "Done", data:{ url }
  });
  });


  app.use(globalErrorHandling);

  // In-valid routing
  app.use("{/*dummy}", (req: Request, res: Response) => {
    return res.status(404).json({ message: "Invalid Routing" });
  });

  // ------------------ Server ------------------
  const httpServer = app.listen(port, () => {
    console.log(`✅ Server is running on port ${port} 🚀`);
  });
  initializeIo(httpServer)

}




export default bootstrap;
