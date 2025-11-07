"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initializeIo = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const token_security_1 = require("../../utils/security/token.security");
const chat_1 = require("../chat");
const error_response_1 = require("../../utils/response/error.response");
exports.connectedSockets = new Map();
let io = undefined;
const initializeIo = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: { origin: "*" },
    });
    io.use(async (socket, next) => {
        try {
            const { user, decoded } = await (0, token_security_1.decodeToken)({
                authorization: socket.handshake?.auth.authorization || "",
                tokenType: token_security_1.TokenEnum.access,
            });
            socket.credentials = { user, decoded };
            exports.connectedSockets.set(user._id.toString(), socket.id);
            io.emit("online_user", user._id.toString());
            next();
        }
        catch (error) {
            next(error);
        }
    });
    const handleDisconnect = (socket) => {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString();
            exports.connectedSockets.delete(userId);
            io?.emit("offline_user", userId);
            console.log(`Logout from ::: ${socket.id}`);
        });
    };
    const chatGateway = new chat_1.ChatGateway();
    io.on("connection", (socket) => {
        chatGateway.register(socket, io);
        handleDisconnect(socket);
    });
};
exports.initializeIo = initializeIo;
const getIo = () => {
    if (!io) {
        throw new error_response_1.BadRequest("Fail to establish server socket Io");
    }
    return io;
};
exports.getIo = getIo;
