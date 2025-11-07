"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvent = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvent {
    chatService = new chat_service_1.ChatService();
    constructor() { }
    sayHi = (socket, io) => {
        return socket.on("sayHi", (message, socket, callback) => {
            this.chatService.sayHi({ message, callback, socket, io });
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", (data, callback) => {
            this.chatService.sendMessage({ ...data, socket, io });
        });
    };
    joinRoom = (socket, io) => {
        return socket.on("join_room", (data) => {
            this.chatService.joinRoom({ ...data, socket, io });
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on("sendGroupMessage", (data) => {
            this.chatService.sendGroupMessage({ ...data, socket, io });
        });
    };
    typing = (socket, io) => {
        socket.on("typing", (data) => {
            const { chatId, isTyping } = data;
            socket.to(chatId).emit("userTyping", {
                userId: socket.credentials?.user._id,
                isTyping,
            });
        });
    };
}
exports.ChatEvent = ChatEvent;
