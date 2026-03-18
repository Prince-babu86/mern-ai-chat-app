import express from "express";
import http from "http";

const app = express();
const httpServer = http.createServer(app);
import cookieParser from "cookie-parser";
import cors from "cors";

// middleares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

/// init socket server

initSocket(httpServer);

// routes
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import initSocket from "./sockets/index.js";

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

export default httpServer;
