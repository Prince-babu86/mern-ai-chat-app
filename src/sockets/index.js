import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import cookie from "cookie";
import aiService from "../services/ai.service.js";
import Messages from "../models/message.model.js";
import vectorService from "../services/vector.service.js";

async function initSocket(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    let cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.token) {
      next(new Error("Authentication error : No token provided"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentacation error : invalid token"));
    }
  });

  try {
    io.on("connection", (socket) => {
      console.log(`client connected to ${socket.id}`);
      /* 
    messagePayload = {
    chat:chatId,
    content:message content
    }
    */

      socket.on("ai-message", async (messagePayload) => {
        const message = await Messages.create({
          chat: messagePayload?.chat,
          user: socket.user?._id,
          content: messagePayload?.content,
          role: "user",
        });

        const vectors = await aiService.generateVector(messagePayload.content);

        const memory = await vectorService.queryMemory({
          queryVector: vectors,
          limit: 3,
          metadata: {
            user: socket.user._id,
          },
        });

        // console.log(memory);

        await vectorService.createMemory({
          vectors,
          messageId: message._id.toString(),
          metadata: {
            chat: messagePayload.chat.toString(),
            user: socket.user?._id.toString(),
            text: messagePayload.content,
          },
        });

        const chatHistory = (
          await Messages.find({
            chat: messagePayload.chat,
          })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const stm = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item?.content }],
          };
        });

        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `
                these are some previous messages from the chats use them to generate a response         
                ${memory.map((item) => item.metadata.text).join("\n")}       `,
              },
            ],
          },
        ];

        console.log(ltm[0]);
        console.log(stm);
        const response = await aiService.generateResponse([...ltm, ...stm]);

        if (!response) {
          return socket.emit("error", "AI unavailable, try later");
        }

        const responseMessage = await Messages.create({
          chat: messagePayload.chat,
          user: socket?.user?._id,
          content: response || "",
          role: "model",
        });

        const responseVector = await aiService.generateVector(response);

        await vectorService.createMemory({
          vectors: responseVector,
          messageId: responseMessage._id.toString(),
          metadata: {
            chat: messagePayload.chat,
            user: socket?.user?._id,
            text: response,
          },
        });

        socket.emit("ai-response", {
          content: response && response,
          chat: messagePayload.chat,
        });
      });

      socket.on("disconnect", (socket) => {
        console.log(` client disconnected to ${socket.id}`);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
}

export default initSocket;
