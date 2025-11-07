import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { decodeToken, TokenEnum } from "../../utils/security/token.security";
import { IAuthSocket } from "./gateway.interface";
import { ChatGateway } from "../chat";
import { BadRequest } from "../../utils/response/error.response";

export const connectedSockets = new Map<string, string>();
let io: undefined | Server = undefined;

export const initializeIo = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: { origin: "*" },
    });

    io.use(async (socket: IAuthSocket, next) => {
        try {
            const { user, decoded } = await decodeToken({
                authorization: socket.handshake?.auth.authorization || "",
                tokenType: TokenEnum.access,
            });
            socket.credentials = { user, decoded };
            connectedSockets.set(user._id.toString(), socket.id);

            // أعلن عن الأونلاين لكل الكلاينتس
            io.emit("online_user", user._id.toString());

            next();
        } catch (error: any) {
            next(error);
        }
    });

    const handleDisconnect = (socket: IAuthSocket) => {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString() as string;
            connectedSockets.delete(userId);

            io?.emit("offline_user", userId);

            console.log(`Logout from ::: ${socket.id}`);
        });
    };

    const chatGateway = new ChatGateway();

    io.on("connection", (socket: IAuthSocket) => {
        chatGateway.register(socket, io);
        handleDisconnect(socket);
    });
};

export const getIo = (): Server => {
    if (!io) {
        throw new BadRequest("Fail to establish server socket Io");
    }
    return io;
};
