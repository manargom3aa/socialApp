import { Server } from "socket.io";
import { IAuthSocket } from "../gateway"
import { ChatService } from "./chat.service";

export class ChatEvent{
    private chatService: ChatService = new ChatService();
    constructor () {}
    sayHi = (socket:IAuthSocket, io:Server)=> {
        return  socket.on("sayHi",(message,socket, callback) => {
        this.chatService.sayHi({ message, callback ,socket, io })
    });   
    }



        sendMessage = (socket:IAuthSocket, io:Server)=> {
        return  socket.on("sendMessage",(data:{content:string; sendTo:string;}, callback) => {
        this.chatService.sendMessage({ ...data ,socket, io })
    });   
    }

        joinRoom = (socket:IAuthSocket, io:Server)=> {
        return  socket.on("join_room",(data:{roomId:string}) => {
        this.chatService.joinRoom({ ...data ,socket, io })
    });   
    }

        sendGroupMessage = (socket:IAuthSocket, io:Server)=> {
        return  socket.on("sendGroupMessage",(data:{content:string; groupId: string}) => {
        this.chatService.sendGroupMessage({ ...data ,socket, io })
    });   
    }

    typing = (socket: IAuthSocket, io: Server) => {
    socket.on("typing", (data: { chatId: string; isTyping: boolean }) => {
        const { chatId, isTyping } = data;

        socket.to(chatId).emit("userTyping", {
            userId: socket.credentials?.user._id,
            isTyping,
        });
    });
};


}
