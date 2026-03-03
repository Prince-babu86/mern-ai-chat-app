import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import cookie from "cookie";
import aiService from "../services/ai.service.js";
import Messages from "../models/message.model.js";

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

  io.on("connection", (socket) => {
    console.log(`client connected to ${socket.id}`);
    /* 
    messagePayload = {
    chat:chatId,
    content:message content
    }
    */

    socket.on("ai-message", async (messagePayload) => {
      await Messages.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: messagePayload.content,
        role: "user",
      });

      const chatHistory = await Messages.find({
        chat: messagePayload.chat,
      });

      const response = await aiService.generateResponse(
        chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item?.content }],
          };
        }),
      );

      if (!response) {
        return socket.emit("error", "AI unavailable, try later");
      }

      await Messages.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: response || "",
        role: "model",
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
}

export default initSocket;
