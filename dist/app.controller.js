"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({});
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const modules_1 = require("./modules");
const error_response_1 = require("./utils/response/error.response");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const s3_config_1 = require("./utils/multer/s3.config");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const chat_1 = require("./modules/chat");
const express_2 = require("graphql-http/lib/use/express");
const schema_gql_1 = require("./modules/graphql/schema.gql");
const authentication_middleware_1 = require("./middleware/authentication.middleware");
const createS3StreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 2000,
    message: { error: "Too many requests, please try again later" },
    statusCode: 429,
});
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use((0, helmet_1.default)());
    app.use(limiter);
    await (0, connection_db_1.default)();
    app.all("/graphql", (0, authentication_middleware_1.authentication)(), (0, express_2.createHandler)({
        schema: schema_gql_1.schema,
        context: (req) => ({ user: req.raw.user }),
    }));
    app.get("/", (req, res) => {
        res.json({
            message: `Welcome to ${process.env.APPLICATION_NAME} backend landing page 🚀`,
        });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.use("/chat", chat_1.chatRouter);
    app.get("/upload/*path", async (req, res) => {
        const { downloadName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        console.log(s3Response.Body);
        if (!s3Response?.Body) {
            throw new error_response_1.BadRequest("failed to fetch file from s3");
        }
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-Type", `${s3Response.ContentType || "application/octet-stream"}`);
        if (downloadName) {
            res.setHeader("Content-Disposition", `attachment; filename=${Key.split("/").pop() || downloadName}`);
        }
        return await createS3StreamPipe(s3Response.Body, res);
    });
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedLink)({ Key, downloadName: downloadName, download, });
        return res.json({ message: "Done", data: { url }
        });
    });
    app.use(error_response_1.globalErrorHandling);
    app.use("{/*dummy}", (req, res) => {
        return res.status(404).json({ message: "Invalid Routing" });
    });
    const httpServer = app.listen(port, () => {
        console.log(`✅ Server is running on port ${port} 🚀`);
    });
    (0, modules_1.initializeIo)(httpServer);
};
exports.default = bootstrap;
